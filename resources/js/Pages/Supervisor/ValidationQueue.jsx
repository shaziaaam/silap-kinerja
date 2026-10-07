import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import { CheckCircle, XCircle, Eye, AlertCircle, MessageSquare } from 'lucide-react';

export default function ValidationQueue({ observations }) {
    const [selectedObs, setSelectedObs] = useState(null);
    const { data, setData, post, processing } = useForm({
        status_approval: 'approved',
        catatan_supervisor: '',
    });

    const handleAction = (obs, status) => {
        setData({
            status_approval: status,
            catatan_supervisor: status === 'revision' ? data.catatan_supervisor : '',
        });
        post(route('supervisor.action', obs.id));
        setSelectedObs(null);
    };

    return (
        <Sidebar>
            <Head title="Antrean Validasi Penyelia - SILAP-Kinerja" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Antrean Validasi Observasi</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Tinjau dan beri persetujuan atau revisi pada hasil pengamatan cuaca harian.</p>
                </div>

                <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-emerald-50/80 text-emerald-950 uppercase font-bold text-[11px] tracking-wider border-b border-emerald-100">
                                <tr>
                                    <th className="px-5 py-4">Pengamat</th>
                                    <th className="px-5 py-4">Tanggal &amp; Jam</th>
                                    <th className="px-5 py-4">Suhu (Kering/Wet)</th>
                                    <th className="px-5 py-4">Tekanan QFE/QFF</th>
                                    <th className="px-5 py-4">Bukti Foto Watermark</th>
                                    <th className="px-5 py-4 text-right">Aksi Validasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                                {observations.data.length > 0 ? (
                                    observations.data.map((obs) => (
                                        <tr key={obs.id} className="hover:bg-emerald-50/40 transition">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-900">{obs.user?.nama}</div>
                                                <div className="text-[11px] text-slate-500">NIP: {obs.user?.nip}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-900">{obs.tanggal}</div>
                                                <div className="text-[11px] text-emerald-700 font-medium">
                                                    UTC {obs.schedule?.jam_utc?.substring(0, 5)} ({obs.schedule?.jam_wib?.substring(0, 5)} WIB)
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div>Kering: <span className="text-slate-900 font-bold">{obs.suhu_bola_kering ?? '-'} °C</span></div>
                                                <div>Basah: <span className="text-slate-900 font-bold">{obs.suhu_bola_basah ?? '-'} °C</span></div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div>QFE: <span className="text-slate-900 font-bold">{obs.tekanan_qfe ?? '-'} mbar</span></div>
                                                <div>QFF: <span className="text-slate-900 font-bold">{obs.tekanan_qff ?? '-'} mbar</span></div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {obs.foto_path ? (
                                                    <a href={`/${obs.foto_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-semibold hover:underline">
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Lihat Watermark</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 italic">Tanpa Foto</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(obs, 'approved')}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 transition shadow-md shadow-emerald-600/20"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        <span>Approve</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedObs(obs)}
                                                        className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 transition"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                        <span>Revisi</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-slate-500 italic font-medium">
                                            Tidak ada antrean validasi pending saat ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Revision Note Modal */}
                {selectedObs && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white border border-emerald-100 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                            <h3 className="font-extrabold text-lg text-slate-900 mb-1 flex items-center space-x-2">
                                <MessageSquare className="w-5 h-5 text-rose-600" />
                                <span>Kirim Catatan Revisi Pengamatan</span>
                            </h3>
                            <p className="text-xs text-slate-600 mb-4">
                                Pengamat: <strong className="text-slate-900">{selectedObs.user?.nama}</strong> | Tanggal: {selectedObs.tanggal}
                            </p>
                            <textarea
                                value={data.catatan_supervisor}
                                onChange={(e) => setData('catatan_supervisor', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none"
                                placeholder="Jelaskan bagian data yang perlu diperbaiki oleh pengamat..."
                                rows="3"
                                required
                            />
                            <div className="flex items-center justify-end space-x-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedObs(null)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAction(selectedObs, 'revision')}
                                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/20"
                                >
                                    Kirim Revisi
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </Sidebar>
    );
}
