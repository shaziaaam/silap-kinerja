import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import { CheckCircle, XCircle, Eye, AlertCircle, MessageSquare, CheckCheck, Camera, ShieldCheck, Filter } from 'lucide-react';

export default function ValidationQueue({ observations = { data: [] }, quarterSummary = [], selectedTahun = 2026, selectedTriwulan = 'T1' }) {
    const [selectedObs, setSelectedObs] = useState(null);
    const [filterTahun, setFilterTahun] = useState(selectedTahun);
    const [filterTriwulan, setFilterTriwulan] = useState(selectedTriwulan);

    const { data: revData, setData: setRevData, post: postRev, processing: revProcessing } = useForm({
        status_approval: 'revision',
        catatan_supervisor: '',
    });

    const handleFilterChange = (tahun, triwulan) => {
        setFilterTahun(tahun);
        setFilterTriwulan(triwulan);
        router.get(route('supervisor.queue'), { tahun, triwulan }, { preserveState: true });
    };

    const handleActionRevision = (obs) => {
        postRev(route('supervisor.action', obs.id), {
            data: {
                status_approval: 'revision',
                catatan_supervisor: revData.catatan_supervisor,
            },
            onSuccess: () => {
                setSelectedObs(null);
                setRevData('catatan_supervisor', '');
            }
        });
    };

    const handleApproveQuarter = (userId) => {
        if (!confirm(`Setujui seluruh observasi Triwulan ${filterTriwulan} ${filterTahun} untuk pegawai ini?`)) return;
        router.post(route('supervisor.approve_quarter'), {
            user_id: userId,
            tahun: filterTahun,
            triwulan: filterTriwulan,
            catatan: `ACC Triwulan ${filterTriwulan} ${filterTahun} oleh Penyelia`,
        });
    };

    const handleApproveAll = () => {
        if (!confirm(`Setujui SEMUA pegawai untuk Triwulan ${filterTriwulan} ${filterTahun}? Pegawai yang masih memiliki catatan revisi akan dilewati otomatis.`)) return;
        router.post(route('supervisor.approve_all'), {
            tahun: filterTahun,
            triwulan: filterTriwulan,
        });
    };

    return (
        <Sidebar>
            <Head title="Validasi & ACC Triwulan Penyelia - SILAP-Kinerja" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
                {/* Header & Filter Triwulan */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                            Persetujuan Kinerja Triwulan &amp; Antrean Observasi
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Unit persetujuan resmi penyelia dilakukan per triwulan per pegawai (dengan verifikasi foto 07.00 &amp; 17.00).
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={filterTahun}
                                onChange={(e) => handleFilterChange(e.target.value, filterTriwulan)}
                                className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                            >
                                {[2025, 2026, 2027].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <span className="text-slate-300">|</span>
                            <select
                                value={filterTriwulan}
                                onChange={(e) => handleFilterChange(filterTahun, e.target.value)}
                                className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                            >
                                <option value="T1">Triwulan 1 (Jan–Mar)</option>
                                <option value="T2">Triwulan 2 (Apr–Jun)</option>
                                <option value="T3">Triwulan 3 (Jul–Sep)</option>
                                <option value="T4">Triwulan 4 (Okt–Des)</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={handleApproveAll}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                            <CheckCheck className="w-4 h-4" />
                            <span>Setujui Semua Triwulan</span>
                        </button>
                    </div>
                </div>

                {/* Bagian 1: Ringkasan ACC Triwulan Per Pegawai */}
                <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-sm space-y-3 p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                                <ShieldCheck className="w-4 h-4 text-sky-600" />
                                <span>1. Rekap Kinerja &amp; ACC Triwulan {filterTriwulan} {filterTahun}</span>
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Verifikasi kepatuhan pengambilan foto pada slot wajib (07.00 shift pagi &amp; 17.00 shift siang). ACC diblokir jika pegawai masih punya observasi berstatus revisi.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto pt-2">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-sky-50/70 text-slate-900 uppercase font-bold text-[10px] tracking-wider border-b border-sky-100">
                                <tr>
                                    <th className="px-4 py-3">Nama Pengamat</th>
                                    <th className="px-4 py-3 text-center">Total Entri</th>
                                    <th className="px-4 py-3 text-center">Foto 07.00 (Pagi)</th>
                                    <th className="px-4 py-3 text-center">Foto 17.00 (Siang)</th>
                                    <th className="px-4 py-3 text-center">Pending / Revisi</th>
                                    <th className="px-4 py-3 text-center">Status ACC Triwulan</th>
                                    <th className="px-4 py-3 text-right">Aksi ACC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {quarterSummary.map((q) => (
                                    <tr key={q.user.id} className="hover:bg-slate-50/60 transition">
                                        <td className="px-4 py-3.5">
                                            <div className="font-bold text-slate-900">{q.user.nama}</div>
                                            <div className="text-[11px] text-slate-500 font-mono">NIP: {q.user.nip}</div>
                                        </td>
                                        <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                                            {q.total_obs} slot
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className="inline-flex items-center space-x-1 font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 text-[11px]">
                                                <Camera className="w-3 h-3 text-sky-600" />
                                                <span>{q.foto_07_count}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className="inline-flex items-center space-x-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                                                <Camera className="w-3 h-3 text-amber-600" />
                                                <span>{q.foto_17_count}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="space-x-1.5 font-medium">
                                                <span className="text-slate-600">{q.pending_count} pending</span>
                                                {q.revision_count > 0 && (
                                                    <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                                        {q.revision_count} revisi
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            {q.status_acc === 'approved' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                    ✓ Disetujui (Approved)
                                                </span>
                                            ) : q.revision_count > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                                    Ada Catatan Revisi
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                    Menunggu ACC
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                            {q.status_acc === 'approved' ? (
                                                <span className="text-emerald-700 text-[11px] font-semibold italic">Terkunci (Sudah ACC)</span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleApproveQuarter(q.user.id)}
                                                    disabled={!q.can_acc}
                                                    title={q.revision_count > 0 ? 'Selesaikan catatan revisi terlebih dahulu' : 'Setujui Triwulan ini'}
                                                    className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-xl font-bold transition text-xs shadow-xs cursor-pointer inline-flex items-center space-x-1"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    <span>Setujui Triwulan</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bagian 2: Antrean Observasi Detail (Jalur Pengecualian Revisi Per Entri) */}
                <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-sm space-y-3 p-6">
                    <div className="border-b border-slate-100 pb-3">
                        <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>2. Antrean Tinjauan Observasi Butuh Perhatian</span>
                        </h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Penyelia dapat meneliti nilai entri pengamatan, memeriksa bukti foto, atau mengembalikan dengan catatan revisi bila terjadi kekeliruan pembacaan.
                        </p>
                    </div>

                    <div className="overflow-x-auto pt-2">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-sky-50/70 text-slate-900 uppercase font-bold text-[10px] tracking-wider border-b border-sky-100">
                                <tr>
                                    <th className="px-4 py-3 whitespace-nowrap">Pengamat</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Tanggal &amp; Slot</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Status Pengamatan</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Status Tinjauan</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Bukti Foto</th>
                                    <th className="px-4 py-3 whitespace-nowrap text-right">Aksi Pengecualian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {observations.data && observations.data.length > 0 ? (
                                    observations.data.map((obs) => {
                                        const cleanDate = typeof obs.tanggal === 'string' ? obs.tanggal.split('T')[0] : obs.tanggal;
                                        const jw = obs.schedule?.jam_wib?.substring(0, 5) || '07:00';
                                        return (
                                            <tr key={obs.id} className="hover:bg-slate-50/60 transition">
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <div className="font-bold text-slate-900">{obs.user?.nama}</div>
                                                    <div className="text-[11px] text-slate-500 font-mono">NIP: {obs.user?.nip}</div>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <div className="font-bold text-slate-900">{cleanDate}</div>
                                                    <div className="text-[11px] text-sky-700 font-medium">
                                                        Slot Pukul {jw} WIB
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${obs.status_pengamatan === 'lengkap' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                                                        {obs.status_pengamatan}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${obs.status_approval === 'revision' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                                                        {obs.status_approval === 'revision' ? 'Sedang Revisi' : 'Pending Tinjauan'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {obs.foto_path || obs.foto_gdrive_url || obs.foto_gdrive_id ? (
                                                        <a
                                                            href={route('observations.photo', obs.id)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center space-x-1 text-sky-600 hover:text-sky-800 font-semibold text-xs hover:underline cursor-pointer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                                            <span>Lihat Foto ({jw})</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-[11px]">Tanpa Foto</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <a
                                                            href={route('observations.pdf', obs.id)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                        >
                                                            Lihat PDF Slot
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedObs(obs)}
                                                            className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition text-xs cursor-pointer"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                            <span>Beri Revisi</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-slate-500 italic font-medium">
                                            Tidak ada entri observasi pending atau revisi saat ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Catatan Revisi */}
                {selectedObs && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="bg-white border border-sky-100 rounded-2xl p-6 w-full max-w-lg shadow-xl">
                            <h3 className="font-extrabold text-base text-slate-900 mb-1 flex items-center space-x-2">
                                <MessageSquare className="w-5 h-5 text-rose-600" />
                                <span>Kirim Catatan Revisi Pengamatan</span>
                            </h3>
                            <p className="text-xs text-slate-600 mb-4 font-medium">
                                Pengamat: <strong className="text-slate-900">{selectedObs.user?.nama}</strong> | Slot: {selectedObs.schedule?.jam_wib} WIB ({selectedObs.tanggal})
                            </p>
                            <textarea
                                value={revData.catatan_supervisor}
                                onChange={(e) => setRevData('catatan_supervisor', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none font-medium"
                                placeholder="Jelaskan parameter atau nilai yang keliru dan perlu diperbaiki pengamat..."
                                rows="3"
                                required
                            />
                            <div className="flex items-center justify-end space-x-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedObs(null)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleActionRevision(selectedObs)}
                                    disabled={revProcessing || !revData.catatan_supervisor}
                                    className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                                >
                                    Kirim Catatan Revisi
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </Sidebar>
    );
}
