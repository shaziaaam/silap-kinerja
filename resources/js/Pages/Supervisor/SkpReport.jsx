import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import { Download, RefreshCw, Archive, CheckCircle2, FileSpreadsheet, Filter } from 'lucide-react';

const BULAN_OPTIONS = [
    { value: 'B1', label: 'Bulan 1 (Januari)' },
    { value: 'B2', label: 'Bulan 2 (Februari)' },
    { value: 'B3', label: 'Bulan 3 (Maret)' },
    { value: 'B4', label: 'Bulan 4 (April)' },
    { value: 'B5', label: 'Bulan 5 (Mei)' },
    { value: 'B6', label: 'Bulan 6 (Juni)' },
    { value: 'B7', label: 'Bulan 7 (Juli)' },
    { value: 'B8', label: 'Bulan 8 (Agustus)' },
    { value: 'B9', label: 'Bulan 9 (September)' },
    { value: 'B10', label: 'Bulan 10 (Oktober)' },
    { value: 'B11', label: 'Bulan 11 (November)' },
    { value: 'B12', label: 'Bulan 12 (Desember)' },
];

const TRIWULAN_OPTIONS = [
    { value: 'T1', label: 'Triwulan 1 (Januari - Maret)' },
    { value: 'T2', label: 'Triwulan 2 (April - Juni)' },
    { value: 'T3', label: 'Triwulan 3 (Juli - September)' },
    { value: 'T4', label: 'Triwulan 4 (Oktober - Desember)' },
];

export default function SkpReport({ pengamatList, recaps }) {
    const { auth, flash, errors } = usePage().props;
    const user = auth?.user;

    const [jenisPeriode, setJenisPeriode] = useState('triwulan'); // 'bulanan' or 'triwulan'
    const [selectedPeriode, setSelectedPeriode] = useState('T1');
    const [tahun, setTahun] = useState(new Date().getFullYear());
    const [selectedUser, setSelectedUser] = useState('all');

    const handleJenisPeriodeChange = (jenis) => {
        setJenisPeriode(jenis);
        if (jenis === 'bulanan') {
            setSelectedPeriode('B1');
        } else {
            setSelectedPeriode('T1');
        }
    };

    const { post, processing } = useForm();

    const handleGenerate = (e) => {
        e.preventDefault();
        post(route('supervisor.skp.generate', {
            user_id: selectedUser,
            tahun: tahun,
            periode: selectedPeriode,
        }));
    };

    const handleDownloadZip = (e) => {
        e.preventDefault();
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = route('supervisor.skp.zip');

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }

        const tahunInput = document.createElement('input');
        tahunInput.type = 'hidden';
        tahunInput.name = 'tahun';
        tahunInput.value = tahun;
        form.appendChild(tahunInput);

        const periodeInput = document.createElement('input');
        periodeInput.type = 'hidden';
        periodeInput.name = 'periode';
        periodeInput.value = selectedPeriode;
        form.appendChild(periodeInput);

        const userInput = document.createElement('input');
        userInput.type = 'hidden';
        userInput.name = 'user_id';
        userInput.value = selectedUser;
        form.appendChild(userInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
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
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Generate Rekap SKP Pegawai</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Perhitungan otomatis jumlah observasi valid (Approved) bulanan dan triwulanan sebagai bukti dukung fisik SKP pegawai BMKG.
                    </p>
                </div>

                {/* Main Filter & Generator Form */}
                <div className="bg-white border border-sky-100/80 rounded-2xl p-6 shadow-sm shadow-sky-100/30">
                    <form onSubmit={handleGenerate} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                            {/* Jenis Periode Toggle */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Periode</label>
                                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 h-9">
                                    <button
                                        type="button"
                                        onClick={() => handleJenisPeriodeChange('triwulan')}
                                        className={`rounded-lg text-xs font-bold transition ${
                                            jenisPeriode === 'triwulan'
                                                ? 'bg-sky-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Triwulanan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleJenisPeriodeChange('bulanan')}
                                        className={`rounded-lg text-xs font-bold transition ${
                                            jenisPeriode === 'bulanan'
                                                ? 'bg-sky-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Bulanan
                                    </button>
                                </div>
                            </div>

                            {/* Periode Dropdown */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    {jenisPeriode === 'bulanan' ? 'Pilih Bulan' : 'Pilih Triwulan'}
                                </label>
                                <select
                                    value={selectedPeriode}
                                    onChange={(e) => setSelectedPeriode(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-9 text-slate-900 text-xs placeholder:text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition outline-none font-medium"
                                >
                                    {(jenisPeriode === 'bulanan' ? BULAN_OPTIONS : TRIWULAN_OPTIONS).map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tahun */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tahun</label>
                                <input
                                    type="number"
                                    value={tahun}
                                    onChange={(e) => setTahun(parseInt(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-9 text-slate-900 text-xs placeholder:text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition outline-none font-medium"
                                    required
                                />
                            </div>

                            {/* Pilih Pegawai */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pegawai</label>
                                <select
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-9 text-slate-900 text-xs placeholder:text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition outline-none font-medium"
                                >
                                    {user.role !== 'pengamat' && (
                                        <option value="all">Semua Pegawai (Paket ZIP)</option>
                                    )}
                                    {pengamatList.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nama} ({p.nip})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 bg-sky-600 hover:bg-sky-700 text-white font-semibold h-10 rounded-xl text-xs transition shadow-sm shadow-sky-600/20 flex items-center space-x-2 disabled:opacity-50"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Hitung &amp; Generate SKP</span>
                            </button>

                            {user.role !== 'pengamat' && (
                                selectedUser === 'all' ? (
                                    <button
                                        type="button"
                                        onClick={handleDownloadZip}
                                        className="px-5 bg-slate-800 hover:bg-slate-900 text-white font-semibold h-10 rounded-xl text-xs transition shadow-sm flex items-center space-x-2"
                                    >
                                        <Archive className="w-4 h-4" />
                                        <span>Unduh Paket ZIP (Semua Pegawai)</span>
                                    </button>
                                ) : (
                                    <a
                                        href={route('supervisor.skp.pdf-direct', { user_id: selectedUser, tahun, periode: selectedPeriode })}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-5 bg-slate-800 hover:bg-slate-900 text-white font-semibold h-10 rounded-xl text-xs transition shadow-sm flex items-center space-x-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Cetak PDF SKP (Pegawai Terpilih)</span>
                                    </a>
                                )
                            )}
                        </div>
                    </form>
                </div>

                {/* Table of Generated SKP Recaps */}
                <div className="bg-white border border-sky-100/80 rounded-2xl overflow-hidden shadow-sm shadow-sky-100/30">
                    <div className="px-6 py-4 border-b border-sky-100 font-extrabold text-sm text-slate-900 bg-sky-50/70 flex items-center justify-between">
                        <span>Daftar Rekap SKP Ter-Generate ({recaps.data.length} Data)</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-sky-50/70 text-slate-900 uppercase font-bold text-[11px] tracking-wider border-b border-sky-100">
                                <tr>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Pengamat</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Periode SKP</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Total Observasi Valid</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Waktu Generate</th>
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
                                                {new Date(r.tanggal_generate).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {r.has_pending_revisions ? (
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
                                            Belum ada rekap SKP yang di-generate.
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
