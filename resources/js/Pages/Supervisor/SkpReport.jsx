import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import { Download, RefreshCw, Archive, CheckCircle2, FileSpreadsheet, Filter } from 'lucide-react';

const TRIWULAN_OPTIONS = [
    { value: 'T1', label: 'Triwulan 1 (Januari - Maret)' },
    { value: 'T2', label: 'Triwulan 2 (April - Juni)' },
    { value: 'T3', label: 'Triwulan 3 (Juli - September)' },
    { value: 'T4', label: 'Triwulan 4 (Oktober - Desember)' },
];

export default function SkpReport({ pengamatList, recaps, alasanLaporan = {}, skpExports = [] }) {
    const { auth, flash, errors } = usePage().props;
    const user = auth?.user;

    const isPengamat = user?.role === 'pengamat';
    const triwulanSekarang = `T${Math.floor(new Date().getMonth() / 3) + 1}`;
    const [selectedPeriode, setSelectedPeriode] = useState(triwulanSekarang);
    const [tahun, setTahun] = useState(new Date().getFullYear());
    // Pengamat can only ever pick themselves; the server enforces it as well.
    const [selectedUser, setSelectedUser] = useState(isPengamat ? user.id : (pengamatList[0]?.id ?? ''));

    const { post, processing } = useForm();

    // Poll only while a package is still being built, then stop.
    const adaEksporBerjalan = skpExports.some(e => e.sedang_berjalan);
    useEffect(() => {
        if (!adaEksporBerjalan) return;
        const timer = setInterval(() => router.reload({ only: ['skpExports'] }), 8000);
        return () => clearInterval(timer);
    }, [adaEksporBerjalan]);

    const pdfUrl = selectedUser && tahun
        ? route('supervisor.skp.pdf-direct', { user_id: selectedUser, tahun, periode: selectedPeriode })
        : null;

    // Kenapa PDF pilihan ini belum bisa diunduh ('' = siap). Tanpa baris rekap berarti belum di-ACC.
    const kunciLaporan = `${selectedUser}|${tahun}|${selectedPeriode}`;
    const alasanPdf = !tahun
        ? 'Isi tahun terlebih dahulu.'
        : (kunciLaporan in alasanLaporan ? alasanLaporan[kunciLaporan] : 'Triwulan ini belum di-ACC oleh penyelia, jadi laporannya belum tersedia.');

    // PDF dengan lampiran foto bisa butuh puluhan detik. Dibuat lewat fetch supaya ada indikator
    // dan pesan gagal; tab dibuka lebih dulu (saat klik) agar tidak diblokir popup-blocker.
    const [menyiapkanPdf, setMenyiapkanPdf] = useState(false);
    const [galatPdf, setGalatPdf] = useState(null);
    const bukaPdf = async (e) => {
        e.preventDefault();
        if (menyiapkanPdf || !pdfUrl) return;
        setGalatPdf(null);
        setMenyiapkanPdf(true);
        const tab = window.open('', '_blank');
        if (tab) {
            tab.document.write('<title>Menyiapkan PDF</title><p style="font-family:sans-serif;padding:2rem">Menyiapkan PDF laporan, mohon tunggu sebentar&hellip;</p>');
        }
        try {
            const res = await fetch(pdfUrl, { credentials: 'same-origin', headers: { Accept: 'application/pdf' } });
            if (!res.ok || !(res.headers.get('content-type') || '').includes('pdf')) throw new Error('bukan pdf');
            const url = URL.createObjectURL(await res.blob());
            if (tab) {
                tab.location.href = url;
            } else {
                const a = document.createElement('a');
                a.href = url;
                a.download = `Laporan_SKP_${selectedPeriode}_${tahun}.pdf`;
                a.click();
            }
            setTimeout(() => URL.revokeObjectURL(url), 120000);
        } catch (err) {
            if (tab) tab.close();
            setGalatPdf('PDF belum bisa dibuat. Coba lagi sebentar; bila tetap gagal, hubungi admin.');
        } finally {
            setMenyiapkanPdf(false);
        }
    };

    const handleDownloadZip = (e) => {
        e.preventDefault();
        // The package is built on the queue; the file appears in the "Paket ZIP" list.
        post(route('supervisor.skp.zip'), {
            data: { tahun, periode: selectedPeriode },
            preserveScroll: true,
        });
    };

    return (
        <Sidebar toast={false}>
            <Head title="Rekap SKP - SILAP-Kinerja" />

            <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
                {flash?.message && (
                    <div className="flex items-center space-x-2 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl px-4 py-3 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-600" />
                        <span>{flash.message}</span>
                    </div>
                )}

                {errors?.message && (
                    <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-sm font-semibold">
                        <span>{errors.message}</span>
                    </div>
                )}

                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Laporan Triwulan (Bukti Dukung SKP)</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {isPengamat
                            ? 'Unduh PDF laporan triwulan Anda. Laporan tersedia setelah triwulan di-ACC penyelia dan hanya memuat data yang disetujui.'
                            : 'Unduh PDF laporan triwulan per pegawai, atau paket ZIP berisi PDF semua pegawai. Laporan tersedia setelah triwulan di-ACC.'}
                    </p>
                </div>

                <div className="bg-white border border-sky-100/80 rounded-2xl p-4 sm:p-6 shadow-sm shadow-sky-100/30 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Triwulan</label>
                            <select
                                value={selectedPeriode}
                                onChange={(e) => setSelectedPeriode(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-10 text-slate-900 text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition outline-none font-medium"
                            >
                                {TRIWULAN_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tahun</label>
                            <input
                                type="number"
                                value={tahun}
                                onChange={(e) => setTahun(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-10 text-slate-900 text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition outline-none font-medium"
                            />
                        </div>

                        {isPengamat ? (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pegawai</label>
                                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 h-10 flex items-center text-slate-700 text-xs font-semibold">
                                    {user.nama}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pegawai (PDF per orang)</label>
                                <select
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-10 text-slate-900 text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition outline-none font-medium"
                                >
                                    {pengamatList.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nama} ({p.nip})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-2 border-t border-slate-100">
                        {selectedUser && (alasanPdf ? (
                            <span
                                className="w-full sm:w-auto justify-center px-5 bg-slate-100 text-slate-400 border border-slate-200 font-semibold h-10 rounded-xl text-xs flex items-center space-x-2 cursor-not-allowed"
                                title={alasanPdf}
                            >
                                <Download className="w-4 h-4" />
                                <span>{isPengamat ? 'Unduh PDF Laporan Triwulan Saya' : 'Unduh PDF Pegawai Terpilih'}</span>
                            </span>
                        ) : (
                            <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={bukaPdf}
                                aria-busy={menyiapkanPdf}
                                className={`w-full sm:w-auto justify-center px-5 text-white font-semibold h-10 rounded-xl text-xs transition shadow-sm flex items-center space-x-2 ${
                                    menyiapkanPdf ? 'bg-sky-500 cursor-wait' : 'bg-sky-600 hover:bg-sky-700'
                                }`}
                            >
                                {menyiapkanPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                <span>
                                    {menyiapkanPdf
                                        ? 'Menyiapkan PDF...'
                                        : (isPengamat ? 'Unduh PDF Laporan Triwulan Saya' : 'Unduh PDF Pegawai Terpilih')}
                                </span>
                            </a>
                        ))}
                        {!isPengamat && (
                            <button
                                type="button"
                                onClick={handleDownloadZip}
                                disabled={processing || !tahun}
                                className="w-full sm:w-auto justify-center px-5 bg-slate-800 hover:bg-slate-900 text-white font-semibold h-10 rounded-xl text-xs transition shadow-sm flex items-center space-x-2 disabled:opacity-50"
                            >
                                <Archive className="w-4 h-4" />
                                <span>Buat Paket ZIP Semua Pegawai</span>
                            </button>
                        )}
                    </div>
                    {selectedUser && alasanPdf && (
                        <p className="sm:text-right text-[11px] text-slate-500">{alasanPdf}</p>
                    )}
                    {menyiapkanPdf && (
                        <p className="sm:text-right text-[11px] text-sky-700">
                            PDF dengan lampiran foto bisa memakan waktu hingga satu menit. Tab baru akan menampilkan PDF begitu siap.
                        </p>
                    )}
                    {galatPdf && <p className="sm:text-right text-[11px] font-semibold text-rose-700">{galatPdf}</p>}
                </div>

                {/* Table of Generated SKP Recaps */}
                <div className="bg-white border border-sky-100/80 rounded-2xl overflow-hidden shadow-sm shadow-sky-100/30">
                    <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-sky-100 font-extrabold text-sm text-slate-900 bg-sky-50/70 flex items-center justify-between">
                        <span>Daftar Laporan Triwulan ({recaps.data.length} Data)</span>
                    </div>

                    {/* Mobile Card View for Recaps */}
                    <div className="md:hidden divide-y divide-sky-50 p-3.5 space-y-3">
                        {recaps.data.length > 0 ? (
                            recaps.data.map((r) => (
                                <div key={r.id} className="pt-2.5 first:pt-0 space-y-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{r.user?.nama}</div>
                                            <div className="text-[11px] text-slate-500 font-mono">NIP: {r.user?.nip}</div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-sky-700 text-xs block">{r.periode_label || r.triwulan}</span>
                                            <span className="text-[11px] text-slate-500 font-medium">Tahun {r.tahun}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-2 bg-sky-50/50 p-2.5 rounded-xl border border-sky-100/60 text-xs">
                                        <div className="flex items-center space-x-1.5">
                                            <span className="bg-sky-100/80 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                                                {r.total_pengamatan_valid} Observasi Valid
                                            </span>
                                            {r.has_pending_revisions && (
                                                <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-bold" title="Ada data observasi yang perlu direvisi">
                                                    Ada Revisi
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                            {r.approved_at ? new Date(r.approved_at).toLocaleDateString('id-ID') : '-'}
                                        </div>
                                    </div>

                                    <div>
                                        {r.status !== 'approved' ? (
                                            <div className="w-full bg-slate-100 text-slate-400 border border-slate-200 py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-1.5 cursor-not-allowed">
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Belum di-ACC</span>
                                            </div>
                                        ) : r.has_pending_revisions ? (
                                            <div className="w-full bg-slate-100 text-slate-400 border border-slate-200 py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-1.5 cursor-not-allowed">
                                                <Download className="w-3.5 h-3.5" />
                                                <span>ACC Diblokir (Ada Revisi)</span>
                                            </div>
                                        ) : (
                                            <a
                                                href={route('supervisor.skp.pdf', r.id)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 min-h-[38px]"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Cetak PDF Laporan</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-slate-500 italic text-xs font-medium">
                                Belum ada triwulan yang di-ACC.
                            </div>
                        )}
                    </div>

                    {/* Desktop Table for Recaps */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-sky-50/70 text-slate-900 uppercase font-bold text-[11px] tracking-wider border-b border-sky-100">
                                <tr>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Pengamat</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Periode SKP</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Total Observasi Valid</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Waktu ACC</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap text-right">Aksi PDF</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sky-50">
                                {recaps.data.length > 0 ? (
                                    recaps.data.map((r) => (
                                        <tr key={r.id} className="hover:bg-sky-50/40 transition">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-900">{r.user?.nama}</div>
                                                <div className="text-[11px] text-slate-500">NIP: {r.user?.nip}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-bold text-sky-700">{r.periode_label || r.triwulan}</span>
                                                <span className="text-slate-500 font-medium ml-1">Tahun {r.tahun}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className="bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 rounded-full font-bold text-xs">
                                                        {r.total_pengamatan_valid} Observasi Valid
                                                    </span>
                                                    {r.has_pending_revisions && (
                                                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md font-bold text-[10px]" title="Ada data observasi yang perlu direvisi">
                                                            Ada Revisi
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-slate-500 font-medium">
                                                {r.approved_at ? new Date(r.approved_at).toLocaleString('id-ID') : '-'}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {r.status !== 'approved' ? (
                                                    <span className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-not-allowed" title="Laporan tersedia setelah triwulan di-ACC penyelia.">
                                                        <Download className="w-3.5 h-3.5" />
                                                        <span>Belum di-ACC</span>
                                                    </span>
                                                ) : r.has_pending_revisions ? (
                                                    <span
                                                        className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-not-allowed"
                                                        title="Pengesahan (ACC) SKP diblokir karena masih ada data observasi berstatus revisi yang belum diperbaiki."
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        <span>ACC Diblokir</span>
                                                    </span>
                                                ) : (
                                                    <a
                                                        href={route('supervisor.skp.pdf', r.id)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center space-x-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        <span>Cetak PDF</span>
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-slate-500 italic font-medium">
                                            Belum ada triwulan yang di-ACC.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {user.role !== 'pengamat' && skpExports.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center space-x-2">
                            <Archive className="w-4 h-4 text-slate-500" />
                            <h2 className="font-bold text-slate-900 text-sm">Paket ZIP</h2>
                            <span className="text-[11px] text-slate-500">dibuat di latar belakang</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {skpExports.map((ex) => (
                                <div key={ex.id} className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900 truncate">
                                            {ex.periode_label} {ex.tahun}
                                            <span className="text-slate-500 font-normal">
                                                {' · '}{ex.target_user ? ex.target_user.nama : 'Semua pegawai'}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                            Diminta {new Date(ex.created_at).toLocaleString('id-ID')}
                                            {ex.status === 'selesai' && ex.jumlah_pegawai > 0 && ` · ${ex.jumlah_pegawai} berkas PDF`}
                                        </div>
                                        {ex.status === 'gagal' && ex.pesan_error && (
                                            <div className="text-[11px] text-rose-600 mt-0.5">{ex.pesan_error}</div>
                                        )}
                                    </div>
                                    <div className="shrink-0 w-full sm:w-auto">
                                        {ex.status === 'selesai' ? (
                                            <a
                                                href={route('supervisor.skp.export_download', ex.id)}
                                                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition min-h-[38px]"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Unduh</span>
                                            </a>
                                        ) : ex.status === 'gagal' ? (
                                            <span className="block sm:inline-block text-center text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-xl">Gagal</span>
                                        ) : (
                                            <div className="flex flex-col sm:items-end gap-1">
                                                <span className="inline-flex items-center justify-center space-x-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1.5 rounded-xl">
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    <span>{ex.status === 'antre' ? 'Mengantre' : 'Memproses'}</span>
                                                </span>
                                                {/* Tanpa queue worker, paket tidak pernah diproses: beri tahu setelah 5 menit. */}
                                                {ex.status === 'antre' && Date.now() - new Date(ex.created_at).getTime() > 5 * 60 * 1000 && (
                                                    <span className="max-w-full sm:max-w-[16rem] text-left sm:text-right text-[10px] leading-snug text-amber-700">
                                                        Belum diproses lebih dari 5 menit. Hubungi admin untuk memastikan queue worker berjalan.
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </Sidebar>
    );
}
