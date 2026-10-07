import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import { Download, Calendar, Filter, Printer, CloudRain } from 'lucide-react';

const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function MonthlyReport({ bulan, tahun, mode, pegawaiId, users, dailySummary, totalHariHujan }) {
    const [selectedBulan, setSelectedBulan] = useState(bulan);
    const [selectedTahun, setSelectedTahun] = useState(tahun);
    const [selectedMode, setSelectedMode] = useState(mode);
    const [selectedPegawaiId, setSelectedPegawaiId] = useState(pegawaiId || (users[0]?.id || ''));

    const handleFilter = (e) => {
        e.preventDefault();
        window.location.href = route('reports.monthly.index', {
            bulan: selectedBulan,
            tahun: selectedTahun,
            mode: selectedMode,
            user_id: selectedMode === 'pegawai' ? selectedPegawaiId : '',
        });
    };

    const pdfUrl = route('reports.monthly.pdf', {
        bulan: selectedBulan,
        tahun: selectedTahun,
        mode: selectedMode,
        user_id: selectedMode === 'pegawai' ? selectedPegawaiId : '',
    });

    return (
        <Sidebar>
            <Head title="Laporan Bulanan Observasi - SILAP-Kinerja" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Laporan Bulanan Observasi Stasiun
                    </h1>
                    <p className="text-slate-500 text-xs mt-1">
                        Rekapitulasi observasi approved per tanggal, curah hujan harian, dan kriteria hari hujan.
                    </p>
                </div>

                {/* Filter Form */}
                <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                        <div className="w-full sm:w-40 shrink-0">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bulan</label>
                            <select
                                value={selectedBulan}
                                onChange={e => setSelectedBulan(parseInt(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-9 text-slate-900 text-xs placeholder:text-xs focus:bg-white focus:border-emerald-500 transition outline-none font-medium"
                            >
                                {NAMA_BULAN.map((b, idx) => (
                                    <option key={b} value={idx + 1}>{b}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full sm:w-28 shrink-0">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tahun</label>
                            <input
                                type="number"
                                value={selectedTahun}
                                onChange={e => setSelectedTahun(parseInt(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-9 text-slate-900 text-xs placeholder:text-xs focus:bg-white focus:border-emerald-500 transition outline-none font-medium"
                            />
                        </div>

                        <div className="w-full sm:w-48 shrink-0">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mode Laporan</label>
                            <select
                                value={selectedMode}
                                onChange={e => setSelectedMode(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-9 text-slate-900 text-xs placeholder:text-xs focus:bg-white focus:border-emerald-500 transition outline-none font-medium"
                            >
                                <option value="stasiun">Seluruh Stasiun</option>
                                <option value="pegawai">Per Pegawai</option>
                            </select>
                        </div>

                        {selectedMode === 'pegawai' && (
                            <div className="w-full sm:w-60 shrink-0">
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Pegawai</label>
                                <select
                                    value={selectedPegawaiId}
                                    onChange={e => setSelectedPegawaiId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-9 text-slate-900 text-xs placeholder:text-xs focus:bg-white focus:border-emerald-500 transition outline-none font-medium"
                                >
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.nama} ({u.nip})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex items-center gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 sm:ml-auto">
                            <button
                                type="submit"
                                className="flex-1 sm:flex-initial px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-sm whitespace-nowrap"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                <span>Tampilkan</span>
                            </button>
                            <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 sm:flex-initial px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold h-10 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-sm whitespace-nowrap"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Unduh / Cetak PDF</span>
                            </a>
                        </div>
                    </form>
                </div>

                {/* Summary Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">
                            <CloudRain className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-medium">Total Hari Hujan (≥0.5 mm)</div>
                            <div className="text-2xl font-extrabold text-slate-900">{totalHariHujan} Hari</div>
                            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Dihitung otomatis dari akumulasi per jam</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">
                            <Calendar className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-medium">Periode &amp; Status Laporan</div>
                            <div className="text-2xl font-extrabold text-slate-900">{NAMA_BULAN[bulan - 1]} {tahun}</div>
                            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Hanya menampilkan data observasi status Approved</div>
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-md">
                    <div className="px-6 py-4 border-b border-emerald-100 font-extrabold text-sm text-slate-900 bg-emerald-50/50 flex items-center justify-between">
                        <span>Daftar Observasi Harian ({dailySummary.length} Hari)</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-emerald-50/80 text-emerald-950 uppercase font-bold text-[11px] tracking-wider border-b border-emerald-100">
                                <tr>
                                    <th className="px-5 py-4 text-center">Tanggal</th>
                                    <th className="px-5 py-4">Slot Jam Terdata (Approved)</th>
                                    <th className="px-5 py-4">Total Curah Hujan Harian</th>
                                    <th className="px-5 py-4">Kriteria Hari Hujan</th>
                                    <th className="px-5 py-4">Kelengkapan Data</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                                {dailySummary.map(row => (
                                    <tr key={row.tgl} className="hover:bg-emerald-50/40 transition">
                                        <td className="px-5 py-4 text-center font-bold text-slate-900">
                                            {String(row.tgl).padStart(2, '0')} {NAMA_BULAN[bulan - 1]} {tahun}
                                        </td>
                                        <td className="px-5 py-4 font-semibold text-slate-800">
                                            {row.slotCount} / 16 Jam Operasional
                                        </td>
                                        <td className="px-5 py-4 font-mono font-bold text-slate-900">
                                            {row.totalRain !== null ? `${row.totalRain.toFixed(1)} mm` : '-'}
                                        </td>
                                        <td className="px-5 py-4">
                                            {row.isRainyDay ? (
                                                <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                                                    Hari Hujan (≥0.5 mm)
                                                </span>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium text-[11px]">
                                                    Bukan Hari Hujan
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            {row.isComplete ? (
                                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                                                    Lengkap (16 Slot)
                                                </span>
                                            ) : (
                                                <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                                                    {row.slotCount === 0 ? 'Tanpa Data Approved' : 'Tidak Lengkap'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </Sidebar>
    );
}
