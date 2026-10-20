import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Sidebar from '../Components/Sidebar';
import {
    FilePlus, ShieldCheck, Camera, AlertCircle, CheckCircle2, Clock, Edit, Download,
    UserCheck, CalendarDays, ImageOff, Server, KeyRound, Unlock, Settings2, CloudSun,
    Thermometer, Droplets, Gauge, Wind, CloudRain, Sun, Cloud, ListChecks,
} from 'lucide-react';

const NAMA_HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const fmtTanggal = (t) => new Date(`${t}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtTanggalPendek = (t) => new Date(`${t}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
const jamTitik = (j) => (j || '').replace(':', '.');

function Kartu({ judul, ikon: Ikon, aksi, children, className = '' }) {
    return (
        <section className={`bg-white border border-sky-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
            <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-sky-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    {Ikon && <Ikon className="w-4 h-4 text-sky-600 shrink-0" />}
                    <span>{judul}</span>
                </h2>
                {aksi && <div className="shrink-0 flex items-center">{aksi}</div>}
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </section>
    );
}

function Angka({ label, nilai, sub, warna = 'slate' }) {
    const w = {
        slate: 'text-slate-900', sky: 'text-sky-700', emerald: 'text-emerald-700', amber: 'text-amber-700', rose: 'text-rose-700',
    }[warna];
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 sm:px-4 py-2.5 sm:py-3 min-w-0">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">{label}</div>
            <div className={`text-xl sm:text-2xl font-extrabold truncate ${w}`}>{nilai}</div>
            {sub && <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">{sub}</div>}
        </div>
    );
}

function BadgeAcc({ status }) {
    return status === 'approved'
        ? <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Sudah di-ACC</span>
        : <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Belum di-ACC</span>;
}

// ---------------------------------------------------------------------------
// Pengamat
// ---------------------------------------------------------------------------

function SlotHariIni({ slot }) {
    return (
        <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1.5 sm:gap-2">
            {slot.map((s) => {
                const o = s.observasi;
                const agm = s.kelompok === 'AGM1B';
                let gaya = 'bg-white border-slate-200 text-slate-500';
                let ket = s.lewat ? 'Belum diisi' : 'Belum waktunya';
                if (o) {
                    if (o.status === 'revision') { gaya = 'bg-rose-50 border-rose-200 text-rose-800'; ket = 'Perlu revisi'; }
                    else if (o.dibatalkan) { gaya = 'bg-slate-100 border-slate-200 text-slate-600'; ket = 'Dibatalkan'; }
                    else { gaya = 'bg-emerald-50 border-emerald-200 text-emerald-800'; ket = o.milikSaya ? 'Diisi Anda' : `Diisi ${o.oleh}`; }
                } else if (s.lewat) {
                    gaya = 'bg-amber-50 border-amber-200 text-amber-800';
                }
                return (
                    <div key={s.id} className={`rounded-xl border p-2 sm:px-3 sm:py-2 ${gaya} ${agm ? 'ring-1 ring-sky-200' : ''}`}>
                        <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs sm:text-sm">{jamTitik(s.jam)}</span>
                            <span className="flex items-center gap-1">
                                {agm && <span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-1 rounded">AGM</span>}
                                {s.wajibFoto && <Camera className={`w-3.5 h-3.5 ${o?.adaFoto ? 'text-emerald-600' : 'text-amber-600'}`} title="Slot wajib foto" />}
                            </span>
                        </div>
                        <div className="text-[10px] font-medium truncate mt-0.5" title={ket}>{ket}</div>
                    </div>
                );
            })}
        </div>
    );
}

function RingkasanShift({ data, shift }) {
    if (!data) {
        return <p className="text-xs text-slate-500">Belum ada observasi pada shift {shift} hari ini.</p>;
    }
    const isi = [
        { ikon: Thermometer, label: 'Suhu rata-rata', v: data.suhu_rata, u: '°C' },
        { ikon: Thermometer, label: 'Suhu maks / min', v: `${data.suhu_maks} / ${data.suhu_min}`, u: '°C' },
        { ikon: Droplets, label: 'Kelembaban', v: data.kelembaban, u: '%' },
        { ikon: Gauge, label: 'Tekanan', v: data.tekanan, u: 'mb' },
        { ikon: Droplets, label: 'Penguapan', v: data.penguapan, u: 'mm' },
        { ikon: Cloud, label: 'Perawanan', v: data.awan, u: 'okta' },
        { ikon: CloudRain, label: 'Curah hujan', v: data.hujan, u: 'mm' },
        { ikon: Sun, label: 'Penyinaran', v: data.penyinaran, u: 'jam' },
        { ikon: Wind, label: 'Angin', v: data.angin_knot === '-' ? '-' : `${data.angin_knot} knot`, u: data.arah_angin !== '-' ? `dari ${data.arah_angin}` : '' },
    ];
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <CloudSun className="w-4 h-4 text-amber-500" />
                <span>{data.keadaan_cuaca}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {isi.map(({ ikon: I, label, v, u }) => (
                    <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <div className="text-[10px] text-slate-500 flex items-center gap-1"><I className="w-3 h-3" />{label}</div>
                        <div className="text-sm font-bold text-slate-900">{v} <span className="text-[11px] font-medium text-slate-500">{v === '-' ? '' : u}</span></div>
                    </div>
                ))}
            </div>
            <p className="text-[11px] text-slate-500">Angka ini sama dengan isi gambar Laporan Kondisi Cuaca di lampiran laporan triwulan.</p>
        </div>
    );
}

function DashboardPengamat(p) {
    const k = p.kelengkapanHariIni;
    const t = p.triwulanSaya;
    return (
        <div className="space-y-6">
            <Kartu
                judul={`Slot hari ini · ${k.jamPenuh.terisi}/${k.jamPenuh.total} jam penuh · AGM 1-B ${k.agm1b.terisi}/${k.agm1b.total}`}
                ikon={Clock}
                aksi={p.slotBerikutnya && (
                    <Link href={route('observations.create')} className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                        <FilePlus className="w-3.5 h-3.5" /> Isi slot {jamTitik(p.slotBerikutnya.jam)}
                    </Link>
                )}
            >
                <SlotHariIni slot={p.slotHariIni} />
                <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-200" /> terisi</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-200" /> sudah lewat, belum diisi</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-200" /> perlu revisi</span>
                    <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> wajib foto</span>
                    <span className="flex items-center gap-1"><span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-1 rounded">AGM</span> tab FDIH</span>
                </div>
            </Kartu>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Kartu judul={`Perlu diperbaiki (${p.perluDiperbaiki.length})`} ikon={AlertCircle}>
                    {p.perluDiperbaiki.length === 0 ? (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tidak ada observasi yang dikembalikan penyelia.</p>
                    ) : (
                        <ul className="space-y-2">
                            {p.perluDiperbaiki.map((r) => (
                                <li key={r.id} className="rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-900">{fmtTanggalPendek(r.tanggal)} · {jamTitik(r.jam)} WIB</div>
                                        <div className="text-[11px] text-rose-800">“{r.catatan || 'Tanpa catatan'}”</div>
                                    </div>
                                    <Link href={route('observations.edit', r.id)} className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-white border border-rose-200 px-2.5 py-1 rounded-lg">
                                        <Edit className="w-3.5 h-3.5" /> Perbaiki
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Kartu>

                <Kartu judul={`Ringkasan shift ${p.shiftSekarang} hari ini`} ikon={CloudSun}>
                    <RingkasanShift data={p.ringkasanShift} shift={p.shiftSekarang} />
                </Kartu>
            </div>

            <Kartu
                judul={`Triwulan saya · ${p.periodeLabel} ${p.tahun}`}
                ikon={ShieldCheck}
                aksi={<BadgeAcc status={t.statusAcc} />}
            >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    <Angka label="Kelengkapan" nilai={`${String(t.kelengkapan).replace('.', ',')}%`} sub={`${t.jumlahObservasi} dari ${t.jadwal} slot terjadwal`} warna="sky" />
                    <Angka label="Foto shift" nilai={`${t.fotoTerpenuhi}/${t.fotoWajib}`} sub="shift dengan foto wajib" warna={t.fotoTerpenuhi < t.fotoWajib ? 'amber' : 'emerald'} />
                    <Angka label="Perlu revisi" nilai={t.revisi} warna={t.revisi ? 'rose' : 'emerald'} />
                    <Angka label="Foto galeri" nilai={t.fotoGaleri} sub="unggahan darurat" warna={t.fotoGaleri ? 'amber' : 'slate'} />
                </div>
                <div className="mt-4 flex justify-end">
                    {t.recapId ? (
                        <a href={route('supervisor.skp.pdf', t.recapId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-xl">
                            <Download className="w-3.5 h-3.5" /> Unduh PDF laporan triwulan
                        </a>
                    ) : (
                        <span className="text-[11px] text-slate-500">PDF laporan triwulan tersedia setelah triwulan di-ACC penyelia.</span>
                    )}
                </div>
            </Kartu>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Penyelia
// ---------------------------------------------------------------------------

function KalenderStasiun({ kalender }) {
    const kosongAwal = (kalender.hari[0]?.hariMinggu ?? 1) - 1;
    const warna = (h) => {
        if (h.nanti) return 'bg-slate-50 text-slate-300 border-slate-100';
        if (h.persen >= 100) return 'bg-emerald-500 text-white border-emerald-500';
        if (h.persen >= 75) return 'bg-emerald-200 text-emerald-900 border-emerald-200';
        if (h.persen > 0) return 'bg-amber-100 text-amber-900 border-amber-200';
        return 'bg-rose-50 text-rose-700 border-rose-200';
    };
    return (
        <div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
                {NAMA_HARI.map((n) => <div key={n} className="text-[10px] sm:text-xs font-bold text-slate-400">{n}</div>)}
                {Array.from({ length: kosongAwal }).map((_, i) => <div key={`k${i}`} />)}
                {kalender.hari.map((h) => (
                    <div
                        key={h.tanggal}
                        title={`${fmtTanggal(h.tanggal)}: jam penuh ${h.jamPenuh}/${kalender.totalJamPenuh}, AGM 1-B ${h.agm1b}/${kalender.totalAgm1b}`}
                        className={`rounded-lg border py-1 sm:py-1.5 ${warna(h)} ${h.hariIni ? 'ring-2 ring-sky-400' : ''}`}
                    >
                        <div className="text-[11px] sm:text-xs font-bold">{h.hari}</div>
                        {!h.nanti && <div className="text-[8px] sm:text-[9px] font-medium opacity-80">{h.jamPenuh}/{kalender.totalJamPenuh}</div>}
                    </div>
                ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Angka = slot jam penuh terisi. Arahkan kursor / sentuh tanggal untuk melihat slot AGM 1-B.</p>
        </div>
    );
}

function DashboardPenyelia(p) {
    const siap = p.statusTriwulan.filter((s) => s.siapAcc).length;
    const revisi = p.statusTriwulan.reduce((n, s) => n + s.revisi, 0);
    const sudah = p.statusTriwulan.filter((s) => s.statusAcc === 'approved').length;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <Angka label="Siap di-ACC" nilai={siap} sub="pegawai" warna="sky" />
                <Angka label="Sudah di-ACC" nilai={`${sudah}/${p.statusTriwulan.length}`} sub="pegawai" warna="emerald" />
                <Angka label="Observasi revisi" nilai={revisi} sub="menunggu perbaikan" warna={revisi ? 'rose' : 'emerald'} />
                <Angka label="Shift tanpa foto" nilai={p.shiftTanpaFoto.length} sub="bulan ini" warna={p.shiftTanpaFoto.length ? 'amber' : 'emerald'} />
            </div>

            <Kartu
                judul={`Status triwulan per pegawai · ${p.periodeLabel} ${p.tahun}`}
                ikon={UserCheck}
                aksi={<Link href={route('supervisor.queue')} className="text-xs font-bold text-sky-700 hover:underline">Buka antrean validasi →</Link>}
            >
                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-slate-100 -mx-4 -my-4">
                    {p.statusTriwulan.map((s) => (
                        <div key={s.pegawai.id} className="p-3.5 space-y-2.5 text-xs">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="font-bold text-slate-900 text-sm truncate">{s.pegawai.nama}</div>
                                    <div className="text-[10px] text-slate-500 font-medium">{s.jumlahObservasi} observasi</div>
                                </div>
                                <div className="shrink-0">
                                    {s.statusAcc === 'approved' ? <BadgeAcc status="approved" />
                                        : s.siapAcc ? <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Siap di-ACC</span>
                                            : s.revisi ? <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Ada revisi</span>
                                                : <span className="text-[10px] text-slate-400">Belum ada data</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                                    <span className="text-[10px] text-slate-400 block font-medium">Kelengkapan</span>
                                    <span className="font-bold text-sky-700 text-xs sm:text-sm">{String(s.kelengkapan).replace('.', ',')}%</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                                    <span className="text-[10px] text-slate-400 block font-medium">Foto Shift</span>
                                    <span className={`font-bold text-xs sm:text-sm ${s.fotoTerpenuhi < s.fotoWajib ? 'text-amber-700' : 'text-slate-700'}`}>{s.fotoTerpenuhi}/{s.fotoWajib}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                                    <span className="text-[10px] text-slate-400 block font-medium">Revisi</span>
                                    <span className={`font-bold text-xs sm:text-sm ${s.revisi ? 'text-rose-700' : 'text-slate-500'}`}>{s.revisi || '0'}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                                    <span className="text-[10px] text-slate-400 block font-medium">Foto Galeri</span>
                                    <span className={`font-bold text-xs sm:text-sm ${s.fotoGaleri ? 'text-amber-700' : 'text-slate-500'}`}>{s.fotoGaleri || '0'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto -mx-5 -my-5">
                    <table className="w-full text-xs">
                        <thead className="bg-sky-50/60 text-slate-600 text-[11px] uppercase">
                            <tr>
                                <th className="px-4 py-2.5 text-left">Pegawai</th>
                                <th className="px-4 py-2.5 text-center">Kelengkapan</th>
                                <th className="px-4 py-2.5 text-center">Foto shift</th>
                                <th className="px-4 py-2.5 text-center">Revisi</th>
                                <th className="px-4 py-2.5 text-center">Foto galeri</th>
                                <th className="px-4 py-2.5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {p.statusTriwulan.map((s) => (
                                <tr key={s.pegawai.id}>
                                    <td className="px-4 py-2.5">
                                        <div className="font-bold text-slate-900">{s.pegawai.nama}</div>
                                        <div className="text-[10px] text-slate-500">{s.jumlahObservasi} observasi</div>
                                    </td>
                                    <td className="px-4 py-2.5 text-center font-semibold">{String(s.kelengkapan).replace('.', ',')}%</td>
                                    <td className={`px-4 py-2.5 text-center font-semibold ${s.fotoTerpenuhi < s.fotoWajib ? 'text-amber-700' : 'text-slate-700'}`}>{s.fotoTerpenuhi}/{s.fotoWajib}</td>
                                    <td className={`px-4 py-2.5 text-center font-semibold ${s.revisi ? 'text-rose-700' : 'text-slate-400'}`}>{s.revisi || '–'}</td>
                                    <td className={`px-4 py-2.5 text-center font-semibold ${s.fotoGaleri ? 'text-amber-700' : 'text-slate-400'}`}>{s.fotoGaleri || '–'}</td>
                                    <td className="px-4 py-2.5 text-center">
                                        {s.statusAcc === 'approved' ? <BadgeAcc status="approved" />
                                            : s.siapAcc ? <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Siap di-ACC</span>
                                                : s.revisi ? <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Ada revisi</span>
                                                    : <span className="text-[11px] text-slate-400">Belum ada data</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Kartu>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Kartu judul="Kelengkapan stasiun bulan ini" ikon={CalendarDays}>
                    <KalenderStasiun kalender={p.kalender} />
                </Kartu>

                <Kartu judul={`Shift tanpa foto wajib (${p.shiftTanpaFoto.length})`} ikon={ImageOff}>
                    {p.shiftTanpaFoto.length === 0 ? (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Semua slot foto bulan ini sudah berfoto.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto -my-2">
                            {p.shiftTanpaFoto.map((f) => (
                                <li key={`${f.tanggal}${f.jam}`} className="py-2 flex items-center justify-between gap-3 text-xs">
                                    <span className="font-semibold text-slate-800">{fmtTanggalPendek(f.tanggal)} · {jamTitik(f.jam)} <span className="text-slate-500 font-normal">(shift {f.shift})</span></span>
                                    <span className="text-[11px] text-amber-700">{f.keterangan}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Kartu>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

function Status({ ok, teksOk, teksTidak }) {
    return ok
        ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" />{teksOk}</span>
        : <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700"><AlertCircle className="w-3.5 h-3.5" />{teksTidak}</span>;
}

function DashboardAdmin(p) {
    const s = p.sistem;
    const k = p.konfigurasi;
    return (
        <div className="space-y-6">
            <Kartu judul="Antrean & penyimpanan foto" ikon={Server}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    <Angka label="Penyimpanan foto" nilai={s.driveAktif ? 'Google Drive' : 'Server'} sub={`PHOTO_DISK=${s.photoDisk}`} warna="sky" />
                    <Angka label="Foto menunggu upload" nilai={s.fotoMenungguUpload} sub={s.driveAktif ? 'masih di server' : 'mode server'} warna={s.fotoMenungguUpload ? 'amber' : 'emerald'} />
                    <Angka label="Job antre" nilai={s.jobAntre} sub={`queue: ${s.queueConnection}`} />
                    <Angka label="Job gagal" nilai={s.jobGagal} warna={s.jobGagal ? 'rose' : 'emerald'} />
                </div>
                <div className="mt-3 space-y-1">
                    {s.driveAktif && <Status ok={s.driveTerkonfigurasi} teksOk="Kredensial Google Drive terpasang" teksTidak="Kredensial Google Drive belum terpasang: foto tertahan di server" />}
                    {s.driveAktif && s.queueConnection === 'sync' && <Status ok={false} teksTidak="QUEUE_CONNECTION=sync: upload Drive berjalan langsung saat simpan, bukan di latar belakang" />}
                </div>
                {s.jobGagalTerbaru.length > 0 && (
                    <ul className="mt-3 divide-y divide-slate-100 text-xs">
                        {s.jobGagalTerbaru.map((j) => (
                            <li key={j.id} className="py-2">
                                <div className="font-bold text-slate-800">{j.job} <span className="font-normal text-slate-500">· {j.waktu}</span></div>
                                <div className="text-[11px] text-rose-700 truncate" title={j.pesan}>{j.pesan}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </Kartu>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Kartu
                    judul={`Belum mengganti password awal (${p.akunBelumGantiPassword.length})`}
                    ikon={KeyRound}
                    aksi={<Link href={route('admin.users.index')} className="text-xs font-bold text-sky-700 hover:underline">Kelola pengguna →</Link>}
                >
                    {p.akunBelumGantiPassword.length === 0 ? (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Semua akun sudah mengganti password.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100 text-xs -my-2">
                            {p.akunBelumGantiPassword.map((u) => (
                                <li key={u.id} className="py-2 flex justify-between gap-3">
                                    <span className="font-semibold text-slate-800">{u.nama}</span>
                                    <span className="text-slate-500">{u.role} · {u.nip}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Kartu>

                <Kartu judul="Riwayat buka kunci triwulan" ikon={Unlock}>
                    {p.riwayatBukaKunci.length === 0 ? (
                        <p className="text-xs text-slate-500">Belum pernah ada triwulan yang dibuka kuncinya.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100 text-xs -my-2">
                            {p.riwayatBukaKunci.map((r, i) => (
                                <li key={i} className="py-2">
                                    <div className="font-semibold text-slate-800">{r.pegawai} · {r.periode}</div>
                                    <div className="text-[11px] text-slate-500">oleh {r.oleh}, {r.waktu}</div>
                                    <div className="text-[11px] text-slate-700">“{r.alasan}”</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Kartu>
            </div>

            <Kartu
                judul="Konfigurasi"
                ikon={Settings2}
                aksi={<Link href={route('admin.instruments.index')} className="text-xs font-bold text-sky-700 hover:underline">Kelola alat →</Link>}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                    <div>
                        <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5 text-sky-600" />Dropdown tanpa pilihan</div>
                        {k.pilihanKosong.length === 0
                            ? <Status ok teksOk="Semua dropdown punya pilihan" />
                            : <ul className="space-y-0.5 text-amber-700">{k.pilihanKosong.map((x) => <li key={x.kode}>{x.label}</li>)}</ul>}
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 mb-1.5">Parameter nonaktif ({k.parameterNonaktif.length})</div>
                        <ul className="space-y-0.5 text-slate-600 max-h-36 overflow-y-auto">
                            {k.parameterNonaktif.map((x) => <li key={x.id}>Kartu {x.kartu}: {x.label}</li>)}
                            {k.parameterNonaktif.length === 0 && <li className="text-slate-400">–</li>}
                        </ul>
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 mb-1.5">Pengguna & alat</div>
                        <ul className="space-y-0.5 text-slate-600">
                            <li>{k.jumlahPengguna.pengamat ?? 0} pengamat · {k.jumlahPengguna.penyelia ?? 0} penyelia · {k.jumlahPengguna.admin ?? 0} admin</li>
                            <li>Alat nonaktif: {k.alatNonaktif.length ? k.alatNonaktif.map((a) => a.nama).join(', ') : '–'}</li>
                        </ul>
                    </div>
                </div>
            </Kartu>
        </div>
    );
}

// ---------------------------------------------------------------------------

export default function Dashboard(props) {
    const { user, hariIni } = props;
    const peran = { pengamat: 'Pengamat', penyelia: 'Penyelia', admin: 'Admin' }[user.role] || user.role;

    return (
        <Sidebar>
            <Head title="Dashboard - SILAP-Kinerja" />

            <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
                <div className="relative rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-sky-700 via-blue-700 to-sky-800 text-white shadow-sm overflow-hidden border border-sky-600/20">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-white/15 text-sky-100 border border-white/20 mb-2">
                                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                <span>BMKG Staklim Jateng · {peran}</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Halo, {user.nama}!</h1>
                            <p className="text-xs text-sky-100 font-medium mt-0.5">
                                {fmtTanggal(hariIni)}
                                {user.role === 'pengamat' && props.slotBerikutnya && (
                                    <> · Slot berikutnya pukul <strong className="text-white">{jamTitik(props.slotBerikutnya.jam)} WIB</strong></>
                                )}
                            </p>
                        </div>

                        {user.role === 'pengamat' && props.slotBerikutnya && (
                            <Link
                                href={route('observations.create')}
                                className="w-full md:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-white hover:bg-sky-50 text-sky-900 font-bold text-xs sm:text-sm transition shadow-sm shrink-0 active:scale-98"
                            >
                                <FilePlus className="w-4 h-4 text-sky-600 shrink-0" />
                                <span>Input Observasi Pukul {jamTitik(props.slotBerikutnya.jam)} WIB</span>
                            </Link>
                        )}
                    </div>
                </div>

                {user.role === 'pengamat' && <DashboardPengamat {...props} />}
                {user.role === 'penyelia' && <DashboardPenyelia {...props} />}
                {user.role === 'admin' && <DashboardAdmin {...props} />}
            </div>
        </Sidebar>
    );
}
