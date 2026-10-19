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

export default function SkpReport({ pengamatList, recaps, skpExports = [] }) {
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

    const pdfUrl = selectedUser
        ? route('supervisor.skp.pdf-direct', { user_id: selectedUser, tahun, periode: selectedPeriode })
        : null;

    const handleDownloadZip = (e) => {
        e.preventDefault();
        // The package is built on the queue; the file appears in the "Paket ZIP" list.
        post(route('supervisor.skp.zip'), {
            data: { tahun, periode: selectedPeriode },
            preserveScroll: true,
        });
    };

    return (
        <Sidebar>
            <Head title="Rekap SKP - SILAP-Kinerja" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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

                <div className="bg-white border border-sky-100/80 rounded-2xl p-6 shadow-sm shadow-sky-100/30 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Triwulan</label>
                            <select
                                value={selectedPeriode}
                                onChange={(e) => setSelectedPeriode(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-9 text-slate-900 text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition outline-none font-medium"
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
                                onChange={(e) => setTahun(parseInt(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-9 text-slate-900 text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition outline-none font-medium"
                            />
                        </div>

                        {isPengamat ? (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pegawai</label>
                                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 h-9 flex items-center text-slate-700 text-xs font-semibold">
                                    {user.nama}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pegawai (PDF per orang)</label>
                                <select
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-9 text-slate-900 text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition outline-none font-medium"
                                >
                                    {pengamatList.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nama} ({p.nip})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100">
                        {pdfUrl && (
                            <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-5 bg-sky-600 hover:bg-sky-700 text-white font-semibold h-10 rounded-xl text-xs transition shadow-sm flex items-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>{isPengamat ? 'Unduh PDF Laporan Triwulan Saya' : 'Unduh PDF Pegawai Terpilih'}</span>
                            </a>
                        )}
                        {!isPengamat && (
                            <button
                                type="button"
                                onClick={handleDownloadZip}
                                disabled={processing}
                                className="px-5 bg-slate-800 hover:bg-slate-900 text-white font-semibold h-10 rounded-xl text-xs transition shadow-sm flex items-center space-x-2 disabled:opacity-50"
                            >
                                <Archive className="w-4 h-4" />
                                <span>Buat Paket ZIP Semua Pegawai</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Table of Generated SKP Recaps */}
                <div className="bg-white border border-sky-100/80 rounded-2xl overflow-hidden shadow-sm shadow-sky-100/30">
                    <div className="px-6 py-4 border-b border-sky-100 font-extrabold text-sm text-slate-900 bg-sky-50/70 flex items-center justify-between">
                        <span>Daftar Laporan Triwulan ({recaps.data.length} Data)</span>
                    </div>
                    <div className="overflow-x-auto">
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
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center space-x-2">
                            <Archive className="w-4 h-4 text-slate-500" />
                            <h2 className="font-bold text-slate-900 text-sm">Paket ZIP</h2>
                            <span className="text-[11px] text-slate-500">dibuat di latar belakang</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {skpExports.map((ex) => (
                                <div key={ex.id} className="px-5 py-3 flex items-center justify-between gap-4">
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
                                    <div className="shrink-0">
                                        {ex.status === 'selesai' ? (
                                            <a
                                                href={route('supervisor.skp.export_download', ex.id)}
                                                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Unduh</span>
                                            </a>
                                        ) : ex.status === 'gagal' ? (
                                            <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">Gagal</span>
                                        ) : (
                                            <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                <span>{ex.status === 'antre' ? 'Mengantre' : 'Memproses'}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </main>
        </Sidebar>
    );
}
