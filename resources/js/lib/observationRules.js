// Rumus "dihitung app" dan pemeriksaan fisika untuk form observasi.
// Cermin dari App\Services\ObservationRules (server tetap penentu akhir);
// daftar aturan dikirim dari config/silap.php lewat props `aturanFisika`.

const angka = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

const format1 = (v) => {
    const s = (Math.round(v * 10) / 10).toFixed(1);
    return s === '-0.0' ? '0.0' : s;
};

// Nilai terpakai: AWS untuk parameter khusus AWS, selain itu manual.
export const nilaiTerpakai = (param, nilai) =>
    angka(param?.sumber === 'aws' ? nilai?.aws : nilai?.manual);

/**
 * Hitung ulang field dihitung app. `values` keyed by parameter id.
 *   Selisih Tinggi Air = Sebelum − Dibaca
 *   Penguapan Open Pan = Selisih + CH Diukur
 *   Penguapan Piche    = Sekarang − Sebelum
 *   Intensitas Gunn-Bellani = (Skala − Kemarin) × koefisien
 */
export function hitungUlang(values, byKode, koefDefault = 20.8) {
    const next = { ...values };
    const m = (kode) => angka(byKode[kode] ? next[byKode[kode].id]?.manual : null);
    const set = (kode, hasil) => {
        const p = byKode[kode];
        if (p) next[p.id] = { ...(next[p.id] || {}), manual: hasil === null ? '' : format1(hasil) };
    };

    const seb = m('tinggi_air_sebelum');
    const dib = m('tinggi_air_dibaca');
    const selisih = seb !== null && dib !== null ? seb - dib : null;
    set('selisih_tinggi_air', selisih);
    set('penguapan_openpan', selisih === null ? null : selisih + (m('ch_diukur_openpan') ?? 0));

    const pSeb = m('piche_sebelum');
    const pSek = m('piche_sekarang');
    set('penguapan_piche', pSeb !== null && pSek !== null ? pSek - pSeb : null);

    const gKem = m('gunn_bellani_kemarin');
    const gSkala = m('gunn_bellani_skala');
    const koef = angka(byKode.gunn_bellani_skala?.koefisien) ?? koefDefault;
    set('gunn_bellani_intensitas', gKem !== null && gSkala !== null ? (gSkala - gKem) * koef : null);

    return next;
}

const fmtBatas = (min, max, satuan) => {
    const u = satuan ? ` ${satuan}` : '';
    const f = (x) => String(Number(x));
    if (min !== null && min !== undefined && max !== null && max !== undefined) return `${f(min)}–${f(max)}${u}`;
    if (min !== null && min !== undefined) return `minimal ${f(min)}${u}`;
    return `maksimal ${f(max)}${u}`;
};

/**
 * Pelanggaran aturan fisika untuk parameter yang tampil. Nilai kosong dilewati.
 * @returns {{ pesan: string[], perParam: Record<number, string> }}
 */
export function periksa(values, params, aturan = {}) {
    const pesan = [];
    const perParam = {};
    const byKode = {};
    params.forEach((p) => { byKode[p.kode] = p; });
    const tambah = (param, teks) => {
        pesan.push(teks);
        if (param && !perParam[param.id]) perParam[param.id] = teks;
    };

    // 1. Batas wajar (manual: batas parameter; AWS: batas per kolom AWS)
    params.forEach((p) => {
        if (!['number', 'integer'].includes(p.tipe_input) || p.sifat === 'dihitung_app' || !p.is_active) return;
        ['manual', 'aws'].forEach((sumber) => {
            const raw = values[p.id]?.[sumber];
            if (raw === null || raw === undefined || raw === '') return;
            const v = angka(raw);
            const nama = p.label + (sumber === 'aws' ? ` (AWS ${p.kode_aws})` : '');
            if (v === null) return tambah(p, `${nama} harus berupa angka.`);
            if (p.tipe_input === 'integer' && sumber === 'manual' && !Number.isInteger(v)) {
                return tambah(p, `${nama} harus bilangan bulat.`);
            }
            const [min, max] = sumber === 'manual'
                ? [angka(p.batas_min), angka(p.batas_max)]
                : (aturan.batas_aws?.[p.kode_aws] ?? [null, null]);
            if ((min !== null && v < min) || (max !== null && v > max)) {
                tambah(p, `${nama} = ${raw} di luar batas wajar (${fmtBatas(min, max, p.satuan)}).`);
            }
        });
    });

    const nilai = (kode) => (byKode[kode] ? nilaiTerpakai(byKode[kode], values[byKode[kode].id]) : null);

    // 2. TBB <= TBK, Min <= Maks
    (aturan.tidak_lebih_dari || []).forEach(([bawah, atas, teks]) => {
        const b = nilai(bawah);
        const a = nilai(atas);
        if (b !== null && a !== null && b > a) tambah(byKode[bawah], `${teks} (${b} > ${a})`);
    });

    // 3. Bacaan sekarang >= Sebelum (counter, Piche, Gunn-Bellani)
    Object.entries(aturan.sebelum || {}).forEach(([kodeSebelum, kodeSumber]) => {
        if ((aturan.sebelum_boleh_turun || []).includes(kodeSumber)) return;
        const seb = nilai(kodeSebelum);
        const sek = nilai(kodeSumber);
        if (seb !== null && sek !== null && sek < seb) {
            tambah(
                byKode[kodeSumber],
                `${byKode[kodeSumber].label} (${sek}) lebih kecil dari ${byKode[kodeSebelum].label} (${seb}). `
                + 'Jika alat direset atau diisi ulang, tekan "Ubah" pada field Sebelum dan sesuaikan nilainya.',
            );
        }
    });

    // 4. Hasil hitung yang tidak mungkin negatif
    Object.entries(aturan.tidak_negatif || {}).forEach(([kode, teks]) => {
        const v = nilai(kode);
        if (v !== null && v < 0) tambah(byKode[kode], `${teks} (hasil ${v})`);
    });

    return { pesan, perParam };
}
