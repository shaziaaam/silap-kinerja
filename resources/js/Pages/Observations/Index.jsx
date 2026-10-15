import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import { FilePlus, CheckCircle, Clock, AlertCircle, Eye, FileText, Image, Edit } from 'lucide-react';

export default function ObservationIndex({ observations }) {
    const getShiftInfo = (jamWib) => {
        if (!jamWib) return { name: 'Shift Pagi', range: '07:00 - 15:00 WIB' };
        const hour = parseInt(jamWib.substring(0, 2), 10);
        if (hour >= 7 && hour < 15) {
            return { name: 'Shift Pagi', range: '07:00 - 15:00 WIB' };
        } else {
            return { name: 'Shift Siang', range: '15:00 - 22:00 WIB' };
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
                        className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-sm shadow-sky-600/20 flex items-center space-x-1.5 shrink-0"
                    >
                        <FilePlus className="w-3.5 h-3.5" />
                        <span>Input Observasi Baru</span>
                    </Link>
                </div>

                <div className="bg-white border border-sky-100/80 rounded-2xl overflow-hidden shadow-sm shadow-sky-100/30">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-sky-50/70 text-slate-900 uppercase font-bold text-[11px] tracking-wider border-b border-sky-100">
                                <tr>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Tanggal &amp; Jam</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Shift Observasi</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Pengamat (Penginput)</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Bukti Foto</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Status Approval</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap text-right">Cetak PDF</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sky-50">
                                {observations.data.length > 0 ? (
                                    observations.data.map((obs) => {
                                        const shift = getShiftInfo(obs.schedule?.jam_wib);
                                        const cleanDate = typeof obs.tanggal === 'string' ? obs.tanggal.split('T')[0] : obs.tanggal;
                                        return (
                                            <tr key={obs.id} className="hover:bg-sky-50/40 transition">
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-slate-900">{cleanDate}</div>
                                                    <div className="text-[11px] text-sky-700 font-medium">
                                                        Pukul {obs.schedule?.jam_wib?.substring(0, 5)} WIB ({obs.schedule?.jam_utc?.substring(0, 5)} UTC)
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-slate-900">{shift.name}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium">{shift.range}</div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-slate-900">{obs.user?.nama || 'Pengamat'}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium">NIP: {obs.user?.nip || '-'}</div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    {obs.foto_path || obs.foto_gdrive_url || obs.foto_gdrive_id ? (
                                                        <a
                                                            href={route('observations.photo', obs.id)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center space-x-1.5 text-sky-600 hover:text-sky-800 font-semibold text-xs hover:underline cursor-pointer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                                            <span>Lihat Foto</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400 italic font-medium">Tanpa Foto</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    {obs.status_approval === 'approved' && (
                                                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>Approved</span>
                                                        </span>
                                                    )}
                                                    {obs.status_approval === 'pending' && (
                                                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                            <span>Menunggu Validasi</span>
                                                        </span>
                                                    )}
                                                    {obs.status_approval === 'revision' && (
                                                        <div>
                                                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                                                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
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
                                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {obs.status_approval === 'revision' && (
                                                            <Link
                                                                href={route('observations.edit', obs.id)}
                                                                className="inline-flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs"
                                                                title="Perbaiki Data Observasi Sesuai Catatan Revisi"
                                                            >
                                                                <Edit className="w-3.5 h-3.5 text-rose-600" />
                                                                <span>Perbaiki</span>
                                                            </Link>
                                                        )}
                                                        <a
                                                            href={route('observations.pdf', obs.id)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center space-x-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                                                            title="Cetak PDF Observasi Per Jam"
                                                        >
                                                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                                                            <span>PDF</span>
                                                        </a>
                                                        <a
                                                            href={route('observations.shift_image', obs.id)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                                                            title="Generate Gambar Laporan Shift (GD Poppins)"
                                                        >
                                                            <Image className="w-3.5 h-3.5 text-amber-600" />
                                                            <span>Gambar Shift</span>
                                                        </a>
                                                    </div>
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
