<?php

namespace App\Services;

use App\Models\InstrumentParameter;
use App\Models\ObservationValue;
use Illuminate\Support\Collection;

/**
 * Rumus dan aturan fisika pengamatan, dipakai saat simpan dan ubah observasi.
 *
 * Rumus "dihitung app" (catatan revisi 2.1, dicocokkan dengan Lampiran I Perka
 * BMKG No. 4/2016 dan angka layar nasional):
 *   Selisih Tinggi Air   = Tinggi Air Sebelum − Tinggi Air Dibaca   (15 − 31,5 = −16,5)
 *   Penguapan Open Pan   = Selisih + CH Diukur                      (−16,5 + 18 = 1,5)
 *   Penguapan Piche      = Pembacaan Sekarang − Pembacaan Sebelum   (31,5 − 24,2 = 7,3)
 *   Intensitas Gunn-Bellani = (Skala hari ini − Skala kemarin) × koefisien kalibrasi
 *
 * Nilai yang dihitung selalu dihitung ulang di server; kiriman form diabaikan.
 */
class ObservationRules
{
    /**
     * Nilai yang dipakai untuk satu parameter: nilai AWS untuk parameter khusus AWS,
     * selain itu nilai manual (alat yang sama dengan yang dibaca pengamat).
     */
    public static function nilaiTerpakai(InstrumentParameter $p, ?array $nilai): ?string
    {
        $v = $p->sumber === 'aws' ? ($nilai['aws'] ?? null) : ($nilai['manual'] ?? null);

        return ($v === null || $v === '') ? null : (string) $v;
    }

    /**
     * Isi awal field "Sebelum": bacaan terakhir dari field sumbernya di stasiun ini
     * (misal Counter Sebelum = Counter Dibaca pada pengamatan AGM 1-B sebelumnya).
     *
     * @return array<string, string> kode field "Sebelum" => nilai
     */
    public function nilaiSebelum(): array
    {
        $hasil = [];

        foreach (config('silap.aturan_fisika.sebelum') as $kodeSebelum => $kodeSumber) {
            $v = ObservationValue::query()
                ->join('observations', 'observations.id', '=', 'observation_values.observation_id')
                ->join('schedules', 'schedules.id', '=', 'observations.schedule_id')
                ->join('instrument_parameters', 'instrument_parameters.id', '=', 'observation_values.parameter_id')
                ->where('instrument_parameters.kode', $kodeSumber)
                ->where('observations.status_pengamatan', 'lengkap')
                ->whereNotNull('observation_values.nilai_manual')
                ->orderByDesc('observations.tanggal')
                ->orderByDesc('schedules.jam_wib')
                ->orderByDesc('observations.id')
                ->value('observation_values.nilai_manual');

            if ($v !== null) {
                $hasil[$kodeSebelum] = $v;
            }
        }

        return $hasil;
    }

    /**
     * Hitung ulang field "dihitung app" dari nilai input.
     *
     * @param  array<int, array{manual?: mixed, aws?: mixed}>  $values  keyed by parameter id
     * @return array<int, array{manual?: mixed, aws?: mixed}>
     */
    public function hitungUlang(array $values, Collection $params): array
    {
        $byKode = $params->keyBy('kode');
        $angka = function (string $kode) use ($values, $byKode) {
            $p = $byKode->get($kode);
            $v = $p ? ($values[$p->id]['manual'] ?? null) : null;

            return is_numeric($v) ? (float) $v : null;
        };
        $set = function (string $kode, ?float $hasil) use (&$values, $byKode) {
            $p = $byKode->get($kode);
            if ($p) {
                $values[$p->id] = ['manual' => $hasil === null ? null : self::format($hasil), 'aws' => null];
            }
        };

        $sebelum = $angka('tinggi_air_sebelum');
        $dibaca = $angka('tinggi_air_dibaca');
        $selisih = ($sebelum !== null && $dibaca !== null) ? $sebelum - $dibaca : null;
        $set('selisih_tinggi_air', $selisih);
        // CH Diukur kosong berarti tidak ada hujan sejak pembacaan sebelumnya.
        $set('penguapan_openpan', $selisih === null ? null : $selisih + ($angka('ch_diukur_openpan') ?? 0));

        $pSeb = $angka('piche_sebelum');
        $pSek = $angka('piche_sekarang');
        $set('penguapan_piche', ($pSeb !== null && $pSek !== null) ? $pSek - $pSeb : null);

        $gKem = $angka('gunn_bellani_kemarin');
        $gSkala = $angka('gunn_bellani_skala');
        $koef = $byKode->get('gunn_bellani_skala')?->koefisien ?? config('silap.gunn_bellani_koefisien_default');
        $set('gunn_bellani_intensitas', ($gKem !== null && $gSkala !== null) ? ($gSkala - $gKem) * (float) $koef : null);

        return $values;
    }

    /**
     * Semua pelanggaran aturan fisika, dalam bahasa Indonesia. Nilai kosong dilewati.
     *
     * @param  array<int, array{manual?: mixed, aws?: mixed}>  $values  keyed by parameter id
     * @return array<string, string> kunci error => pesan
     */
    public function periksa(array $values, Collection $params): array
    {
        $errors = [];
        $byKode = $params->keyBy('kode');
        $batasAws = config('silap.batas_aws', []);

        // 1. Angka dan batas wajar per parameter (manual dan AWS)
        foreach ($params as $p) {
            if (!in_array($p->tipe_input, ['number', 'integer'], true) || $p->sifat === 'dihitung_app') {
                continue;
            }

            foreach (['manual', 'aws'] as $sumber) {
                $v = $values[$p->id][$sumber] ?? null;
                if ($v === null || $v === '') {
                    continue;
                }
                $nama = $p->label . ($sumber === 'aws' ? " (AWS {$p->kode_aws})" : '');

                if (!is_numeric($v)) {
                    $errors["values.{$p->kode}.{$sumber}"] = "{$nama} harus berupa angka.";
                    continue;
                }
                if ($p->tipe_input === 'integer' && $sumber === 'manual' && floor((float) $v) != (float) $v) {
                    $errors["values.{$p->kode}.{$sumber}"] = "{$nama} harus bilangan bulat.";
                    continue;
                }

                [$min, $max] = $sumber === 'manual'
                    ? [$p->batas_min, $p->batas_max]
                    : ($batasAws[$p->kode_aws] ?? [null, null]);

                if (($min !== null && (float) $v < $min) || ($max !== null && (float) $v > $max)) {
                    $errors["values.{$p->kode}.{$sumber}"] = "{$nama} = {$v} di luar batas wajar ("
                        . self::rentang($min, $max, $p->satuan) . ').';
                }
            }
        }

        $angka = function (string $kode) use ($values, $byKode) {
            $p = $byKode->get($kode);
            $v = $p ? self::nilaiTerpakai($p, $values[$p->id] ?? null) : null;

            return is_numeric($v) ? (float) $v : null;
        };

        // 2. Pasangan bawah <= atas (TBB <= TBK, Min <= Maks)
        foreach (config('silap.aturan_fisika.tidak_lebih_dari') as [$bawah, $atas, $pesan]) {
            $b = $angka($bawah);
            $a = $angka($atas);
            if ($b !== null && $a !== null && $b > $a) {
                $errors["values.{$bawah}"] ??= $pesan . " ({$b} > {$a})";
            }
        }

        // 3. Bacaan sekarang tidak boleh lebih kecil dari "Sebelum"
        $bolehTurun = config('silap.aturan_fisika.sebelum_boleh_turun', []);
        foreach (config('silap.aturan_fisika.sebelum') as $kodeSebelum => $kodeSumber) {
            if (in_array($kodeSumber, $bolehTurun, true)) {
                continue;
            }
            $seb = $angka($kodeSebelum);
            $sek = $angka($kodeSumber);
            if ($seb !== null && $sek !== null && $sek < $seb) {
                $labelSumber = $byKode->get($kodeSumber)?->label ?? $kodeSumber;
                $labelSebelum = $byKode->get($kodeSebelum)?->label ?? $kodeSebelum;
                $errors["values.{$kodeSumber}"] ??= "{$labelSumber} ({$sek}) lebih kecil dari {$labelSebelum} ({$seb}). "
                    . 'Jika alat direset atau diisi ulang, tekan "Ubah" pada field Sebelum dan sesuaikan nilainya.';
            }
        }

        // 4. Hasil hitung yang tidak mungkin negatif
        foreach (config('silap.aturan_fisika.tidak_negatif') as $kode => $pesan) {
            $v = $angka($kode);
            if ($v !== null && $v < 0) {
                $errors["values.{$kode}"] ??= $pesan . " (hasil {$v})";
            }
        }

        return $errors;
    }

    protected static function format(float $v): string
    {
        // One decimal like the national form; avoid "-0.0".
        $s = number_format(round($v, 1), 1, '.', '');

        return $s === '-0.0' ? '0.0' : $s;
    }

    protected static function rentang($min, $max, ?string $satuan): string
    {
        $u = $satuan ? ' ' . $satuan : '';
        $f = fn ($x) => rtrim(rtrim(number_format((float) $x, 2, '.', ''), '0'), '.');

        if ($min !== null && $max !== null) {
            return "{$f($min)}–{$f($max)}{$u}";
        }

        return $min !== null ? "minimal {$f($min)}{$u}" : "maksimal {$f($max)}{$u}";
    }
}
