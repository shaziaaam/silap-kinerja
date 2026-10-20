import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import { CheckCircle, XCircle, Eye, AlertCircle, AlertTriangle, MessageSquare, CheckCheck, Camera, ShieldCheck, Filter, Unlock, Lock } from 'lucide-react';

export default function ValidationQueue({ observations = { data: [] }, quarterSummary = [], selectedTahun = 2026, selectedTriwulan = 'T1' }) {
    const [selectedObs, setSelectedObs] = useState(null);
    const [filterTahun, setFilterTahun] = useState(selectedTahun);
    const [filterTriwulan, setFilterTriwulan] = useState(selectedTriwulan);
    const { auth, flash = {}, errors = {} } = usePage().props;
    const isPenyelia = auth?.user?.role === 'penyelia';
    const isAdmin = auth?.user?.role === 'admin';

    // Admin-only unlock of an approved quarter; a reason is required and recorded.
    const [unlockTarget, setUnlockTarget] = useState(null);
    const unlockForm = useForm({ user_id: '', tahun: selectedTahun, triwulan: selectedTriwulan, alasan: '' });
    const openUnlock = (q) => {
        unlockForm.setData({ user_id: q.user.id, tahun: filterTahun, triwulan: filterTriwulan, alasan: '' });
        unlockForm.clearErrors();
        setUnlockTarget(q);
    };
    const submitUnlock = (e) => {
        e.preventDefault();
        unlockForm.post(route('admin.unlock_quarter'), {
            preserveScroll: true,
            onSuccess: () => setUnlockTarget(null),
        });
    };

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
        <Sidebar toast={false}>
            <Head title="Validasi & ACC Triwulan Penyelia - SILAP-Kinerja" />

            <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
                {unlockTarget && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
                        <form onSubmit={submitUnlock} className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6 space-y-4">
                            <div className="flex items-start space-x-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                                    <Unlock className="w-4 h-4 text-amber-700" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Buka kunci Triwulan {filterTriwulan} {filterTahun}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {unlockTarget.user.nama} &middot; {unlockTarget.approved_count} observasi akan kembali berstatus pending
                                        sehingga dapat diperbaiki, lalu harus di-ACC ulang oleh penyelia.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Alasan membuka kunci (dicatat)</label>
                                <textarea
                                    value={unlockForm.data.alasan}
                                    onChange={(e) => unlockForm.setData('alasan', e.target.value)}
                                    rows="3"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-amber-500"
                                    placeholder="Contoh: salah input TBK tanggal 12 Agustus, diminta pengamat"
                                    required
                                />
                                {unlockForm.errors.alasan && <p className="text-[11px] text-rose-600 mt-1">{unlockForm.errors.alasan}</p>}
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2">
                                <button type="button" onClick={() => setUnlockTarget(null)} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 text-center">
                                    Batal
                                </button>
                                <button type="submit" disabled={unlockForm.processing} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 text-center">
                                    {unlockForm.processing ? 'Memproses...' : 'Buka Kunci'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

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

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs w-full sm:w-auto justify-between sm:justify-start">
                            <div className="flex items-center space-x-2">
                                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <select
                                    value={filterTahun}
                                    onChange={(e) => handleFilterChange(e.target.value, filterTriwulan)}
                                    className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer py-1"
                                >
                                    {[2025, 2026, 2027].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <span className="text-slate-300">|</span>
                            <select
                                value={filterTriwulan}
                                onChange={(e) => handleFilterChange(filterTahun, e.target.value)}
                                className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer py-1"
                            >
                                <option value="T1">Triwulan 1 (Jan–Mar)</option>
                                <option value="T2">Triwulan 2 (Apr–Jun)</option>
                                <option value="T3">Triwulan 3 (Jul–Sep)</option>
                                <option value="T4">Triwulan 4 (Okt–Des)</option>
                            </select>
                        </div>

                        {isPenyelia && (
                        <button
                            type="button"
                            onClick={handleApproveAll}
                            className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 sm:py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer min-h-[40px]"
                        >
                            <CheckCheck className="w-4 h-4" />
                            <span>Setujui Semua Triwulan</span>
                        </button>
                        )}
                    </div>
                </div>

                {flash.message && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl px-4 py-3 text-xs font-semibold flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{flash.message}</span>
                    </div>
                )}
                {(errors.error || errors.catatan_supervisor) && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl px-4 py-3 text-xs font-semibold flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{errors.error || errors.catatan_supervisor}</span>
                    </div>
                )}

                {/* Bagian 1: Ringkasan ACC Triwulan Per Pegawai */}
                <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-sm space-y-3 p-4 sm:p-6">
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

                    {/* Mobile Card List for Section 1 */}
                    <div className="md:hidden divide-y divide-slate-100 pt-1">
                        {quarterSummary.map((q) => (
                            <div key={q.user.id} className="py-3.5 space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">{q.user.nama}</div>
                                        <div className="text-[11px] text-slate-500 font-mono">NIP: {q.user.nip}</div>
                                    </div>
                                    <div>
                                        {q.status_acc === 'approved' ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                ✓ Disetujui
                                            </span>
                                        ) : q.revision_count > 0 ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                                Ada Revisi
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                Menunggu ACC
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Entri</span>
                                        <span className="font-bold text-slate-800">{q.total_obs} slot</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Pending / Revisi</span>
                                        <div className="space-x-1 font-medium text-slate-700">
                                            <span>{q.pending_count} pending</span>
                                            {q.revision_count > 0 && (
                                                <span className="text-rose-700 font-bold bg-rose-100 px-1 py-0.2 rounded">
                                                    {q.revision_count} rev
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Foto 07.00 &amp; 17.00</span>
                                        <div className="flex items-center space-x-1 mt-0.5">
                                            <span className="inline-flex items-center space-x-0.5 font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded text-[10px] border border-sky-200">
                                                <Camera className="w-2.5 h-2.5 text-sky-600" />
                                                <span>07: {q.foto_07_count}</span>
                                            </span>
                                            <span className="inline-flex items-center space-x-0.5 font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-amber-200">
                                                <Camera className="w-2.5 h-2.5 text-amber-600" />
                                                <span>17: {q.foto_17_count}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Foto Galeri</span>
                                        {q.foto_galeri_count > 0 ? (
                                            <span className="inline-flex items-center space-x-1 font-semibold text-orange-800 bg-orange-50 px-1.5 py-0.5 rounded text-[10px] border border-orange-200 mt-0.5">
                                                <AlertTriangle className="w-2.5 h-2.5 text-orange-600" />
                                                <span>{q.foto_galeri_count} darurat</span>
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-[11px]">—</span>
                                        )}
                                    </div>
                                </div>

                                {q.status_acc !== 'approved' && q.recap?.dibuka_at && (
                                    <div className="text-[10px] text-slate-500 bg-amber-50/50 p-2 rounded-lg border border-amber-100" title={q.recap.alasan_buka}>
                                        Kunci dibuka admin {new Date(q.recap.dibuka_at).toLocaleDateString('id-ID')}: {q.recap.alasan_buka}
                                    </div>
                                )}

                                <div>
                                    {q.status_acc === 'approved' ? (
                                        isAdmin ? (
                                            <button
                                                type="button"
                                                onClick={() => openUnlock(q)}
                                                className="w-full bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 py-2 rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1 cursor-pointer min-h-[40px]"
                                            >
                                                <Unlock className="w-3.5 h-3.5" />
                                                <span>Buka Kunci</span>
                                            </button>
                                        ) : (
                                            <div className="text-center py-2 text-emerald-700 text-xs font-semibold italic flex items-center justify-center space-x-1 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                                <Lock className="w-3 h-3" />
                                                <span>Terkunci (Sudah ACC)</span>
                                            </div>
                                        )
                                    ) : !isPenyelia ? (
                                        <div className="text-center py-2 text-slate-400 text-xs italic bg-slate-50 rounded-xl">
                                            Menunggu ACC penyelia
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleApproveQuarter(q.user.id)}
                                            disabled={!q.can_acc}
                                            title={q.revision_count > 0 ? 'Selesaikan catatan revisi terlebih dahulu' : 'Setujui Triwulan ini'}
                                            className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-2 rounded-xl font-bold transition text-xs shadow-xs cursor-pointer flex items-center justify-center space-x-1 min-h-[40px]"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            <span>Setujui Triwulan</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table for Section 1 */}
                    <div className="hidden md:block overflow-x-auto pt-2">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-sky-50/70 text-slate-900 uppercase font-bold text-[10px] tracking-wider border-b border-sky-100">
                                <tr>
                                    <th className="px-4 py-3">Nama Pengamat</th>
                                    <th className="px-4 py-3 text-center">Total Entri</th>
                                    <th className="px-4 py-3 text-center">Foto 07.00 (Pagi)</th>
                                    <th className="px-4 py-3 text-center">Foto 17.00 (Siang)</th>
                                    <th className="px-4 py-3 text-center">Dari Galeri</th>
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
                                            {q.foto_galeri_count > 0 ? (
                                                <span
                                                    title="Foto dipilih dari galeri: koordinat & waktu pada watermark adalah saat unggah, bukan saat pemotretan."
                                                    className="inline-flex items-center space-x-1 font-semibold text-orange-800 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 text-[11px]"
                                                >
                                                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                                                    <span>{q.foto_galeri_count}</span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-[11px]">—</span>
                                            )}
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
                                            {q.status_acc !== 'approved' && q.recap?.dibuka_at && (
                                                <div className="text-[10px] text-slate-500 mt-1" title={q.recap.alasan_buka}>
                                                    Kunci dibuka admin {new Date(q.recap.dibuka_at).toLocaleDateString('id-ID')}: {q.recap.alasan_buka}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                            {q.status_acc === 'approved' ? (
                                                isAdmin ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openUnlock(q)}
                                                        className="bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl font-bold transition text-xs inline-flex items-center space-x-1 cursor-pointer"
                                                    >
                                                        <Unlock className="w-3.5 h-3.5" />
                                                        <span>Buka Kunci</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-emerald-700 text-[11px] font-semibold italic inline-flex items-center space-x-1">
                                                        <Lock className="w-3 h-3" /><span>Terkunci (Sudah ACC)</span>
                                                    </span>
                                                )
                                            ) : !isPenyelia ? (
                                                <span className="text-slate-400 text-[11px] italic">Menunggu ACC penyelia</span>
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
                <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-sm space-y-3 p-4 sm:p-6">
                    <div className="border-b border-slate-100 pb-3">
                        <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>2. Antrean Tinjauan Observasi Butuh Perhatian</span>
                        </h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Penyelia dapat meneliti nilai entri pengamatan, memeriksa bukti foto, atau mengembalikan dengan catatan revisi bila terjadi kekeliruan pembacaan.
                        </p>
                    </div>

                    {/* Mobile Card List for Section 2 */}
                    <div className="md:hidden divide-y divide-slate-100 pt-1">
                        {observations.data && observations.data.length > 0 ? (
                            observations.data.map((obs) => {
                                const cleanDate = typeof obs.tanggal === 'string' ? obs.tanggal.split('T')[0] : obs.tanggal;
                                const jw = obs.schedule?.jam_wib?.substring(0, 5) || '07:00';
                                return (
                                    <div key={obs.id} className="py-3.5 space-y-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm">{obs.user?.nama}</div>
                                                <div className="text-[11px] text-slate-500 font-mono">NIP: {obs.user?.nip}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${obs.status_approval === 'revision' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                                                    {obs.status_approval === 'revision' ? 'Sedang Revisi' : 'Pending'}
                                                </span>
                                                <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${obs.status_pengamatan === 'lengkap' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                                                    {obs.status_pengamatan}
                                                </span>
                                                {obs.alasan_batal && (
                                                    <span className="max-w-[200px] text-right text-[10px] font-medium text-amber-800">
                                                        Kondisi khusus: {obs.alasan_batal}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                                            <div>
                                                <span className="font-bold text-slate-900">{cleanDate}</span>
                                                <div className="text-[11px] text-sky-700 font-medium">
                                                    Slot Pukul {jw} WIB
                                                </div>
                                            </div>
                                            <div>
                                                {obs.foto_path || obs.foto_gdrive_url || obs.foto_gdrive_id ? (
                                                    <a
                                                        href={route('observations.photo', obs.id)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center space-x-1 text-sky-600 hover:text-sky-800 font-semibold text-xs bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-100"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                                        <span>Foto ({jw})</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 italic text-[11px]">Tanpa Foto</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <a
                                                href={route('observations.pdf', obs.id)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-semibold transition text-center flex items-center justify-center min-h-[38px]"
                                            >
                                                Lihat PDF
                                            </a>
                                            {isPenyelia ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedObs(obs)}
                                                    className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 py-2 rounded-xl font-bold flex items-center justify-center space-x-1 transition text-xs cursor-pointer min-h-[38px]"
                                                >
                                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                    <span>Beri Revisi</span>
                                                </button>
                                            ) : (
                                                <div />
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-6 text-slate-500 italic text-xs font-medium">
                                Tidak ada entri observasi pending atau revisi saat ini.
                            </div>
                        )}
                    </div>

                    {/* Desktop Table for Section 2 */}
                    <div className="hidden md:block overflow-x-auto pt-2">
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
                                                    {obs.alasan_batal && (
                                                        <div className="mt-1 max-w-[220px] whitespace-normal text-[10px] font-medium text-amber-800">
                                                            Kondisi khusus: {obs.alasan_batal}
                                                        </div>
                                                    )}
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
                                                        {isPenyelia && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedObs(obs)}
                                                            className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition text-xs cursor-pointer"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                            <span>Beri Revisi</span>
                                                        </button>
                                                        )}
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
                        <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 w-full max-w-lg max-h-[90dvh] overflow-y-auto shadow-xl">
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
                            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedObs(null)}
                                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer text-center"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleActionRevision(selectedObs)}
                                    disabled={revProcessing || !revData.catatan_supervisor}
                                    className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer text-center"
                                >
                                    Kirim Catatan Revisi
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Sidebar>
    );
}
