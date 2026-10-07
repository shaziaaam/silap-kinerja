import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import { FilePlus, CheckCircle, Clock, AlertCircle, Eye, FileText } from 'lucide-react';

export default function ObservationIndex({ observations }) {
    const getShiftInfo = (jamWib) => {
        if (!jamWib) return { name: 'Shift Pagi', range: '07:00 - 14:30 WIB' };
        const hour = parseInt(jamWib.substring(0, 2), 10);
        if (hour >= 7 && hour < 15) {
            return { name: 'Shift Pagi', range: '07:00 - 14:30 WIB' };
        } else {
            return { name: 'Shift Siang', range: '14:30 - 22:00 WIB' };
        }
    };

    return (
        <Sidebar>
            <Head title="Riwayat Observasi - SILAP-Kinerja" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Riwayat Observasi Cuaca</h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Daftar observasi yang telah dicatat beserta status validasi penyelia BMKG.
                        </p>
                    </div>
                    <Link
                        href={route('observations.create')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-2 rounded-lg text-xs transition shadow-xs flex items-center space-x-1.5 shrink-0"
                    >
                        <FilePlus className="w-3.5 h-3.5" />
                        <span>Input Observasi Baru</span>
                    </Link>
                </div>

                <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-emerald-50/80 text-emerald-950 uppercase font-bold text-[11px] tracking-wider border-b border-emerald-100">
                                <tr>
                                    <th className="px-5 py-4">Tanggal &amp; Jam</th>
                                    <th className="px-5 py-4">Shift Observasi</th>
                                    <th className="px-5 py-4">Pengamat (Penginput)</th>
                                    <th className="px-5 py-4">Foto Watermark</th>
                                    <th className="px-5 py-4">Status Approval</th>
                                    <th className="px-5 py-4 text-center">Cetak PDF</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                                {observations.data.length > 0 ? (
                                    observations.data.map((obs) => {
                                        const shift = getShiftInfo(obs.schedule?.jam_wib);
                                        const cleanDate = typeof obs.tanggal === 'string' ? obs.tanggal.split('T')[0] : obs.tanggal;
                                        return (
                                            <tr key={obs.id} className="hover:bg-emerald-50/40 transition">
                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-slate-900">{cleanDate}</div>
                                                    <div className="text-[11px] text-emerald-700 font-medium">
                                                        Pukul {obs.schedule?.jam_wib?.substring(0, 5)} WIB ({obs.schedule?.jam_utc?.substring(0, 5)} UTC)
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-slate-900">{shift.name}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium">{shift.range}</div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-slate-900">{obs.user?.nama || 'Pengamat'}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium">NIP: {obs.user?.nip || '-'}</div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {obs.foto_path ? (
                                                        <a href={`/${obs.foto_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold transition">
                                                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>Lihat Foto Watermark</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Tanpa Foto</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {obs.status_approval === 'approved' && (
                                                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                                                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                                                            <span>Approved</span>
                                                        </span>
                                                    )}
                                                    {obs.status_approval === 'pending' && (
                                                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                                            <Clock className="w-3 h-3 text-amber-600" />
                                                            <span>Menunggu Validasi</span>
                                                        </span>
                                                    )}
                                                    {obs.status_approval === 'revision' && (
                                                        <div>
                                                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold">
                                                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                                                <span>Revisi</span>
                                                            </span>
                                                            {obs.catatan_supervisor && (
                                                                <div className="text-[10px] text-rose-700 mt-1 italic font-medium">
                                                                    Catatan: "{obs.catatan_supervisor}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <a
                                                        href={route('observations.pdf', obs.id)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold transition"
                                                        title="Cetak PDF Observasi Per Jam"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                                                        <span>PDF</span>
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-slate-500 italic font-medium">
                                            Belum ada data observasi yang dicatat.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </Sidebar>
    );
}
