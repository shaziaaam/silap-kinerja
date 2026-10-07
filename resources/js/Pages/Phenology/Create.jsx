import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import WatermarkCamera from '../../Components/WatermarkCamera';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';

export default function PhenologyCreate({ plants, phases }) {
    const { data, setData, post, processing, errors } = useForm({
        tanggal: new Date().toISOString().split('T')[0],
        plant_id: plants[0]?.id || '',
        keadaan: 'baik',
        keterangan: '',
        foto: null,
        selectedPhases: {}, // { [phaseId]: tahap }
    });

    const handlePhaseToggle = (phaseId, isChecked) => {
        const next = { ...data.selectedPhases };
        if (isChecked) {
            next[phaseId] = 'sedang';
        } else {
            delete next[phaseId];
        }
        setData('selectedPhases', next);
    };

    const handleTahapChange = (phaseId, tahap) => {
        setData('selectedPhases', {
            ...data.selectedPhases,
            [phaseId]: tahap,
        });
    };

    const submit = (e) => {
        e.preventDefault();

        const formattedPhases = Object.entries(data.selectedPhases).map(([phase_id, tahap]) => ({
            phase_id: parseInt(phase_id, 10),
            tahap,
        }));

        if (formattedPhases.length === 0) {
            alert('Pilih setidaknya 1 fase perkembangan tanaman.');
            return;
        }

        post(route('phenology.store'), {
            data: {
                ...data,
                phases: formattedPhases,
            }
        });
    };

    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-3.5 h-9 text-slate-900 text-xs placeholder:text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/50 transition font-medium";

    return (
        <Sidebar>
            <Head title="Input Fenologi - SILAP-Kinerja" />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div>
                    <Link href={route('phenology.index')} className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-900 space-x-1 mb-2">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Riwayat Fenologi</span>
                    </Link>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Form Pengamatan Fenologi Harian
                    </h1>
                    <p className="text-slate-500 text-xs mt-1">
                        Pencatatan perkembangan fase pertumbuhan tanaman (sekali per hari per tanaman).
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Part 1: Informasi Pengamatan */}
                    <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-md space-y-6">
                        <h2 className="font-bold text-base text-slate-900 border-b border-emerald-100 pb-3">
                            1. Informasi Tanaman &amp; Tanggal
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Pengamatan</label>
                                <input
                                    type="date"
                                    value={data.tanggal}
                                    onChange={e => setData('tanggal', e.target.value)}
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Tanaman</label>
                                <select
                                    value={data.plant_id}
                                    onChange={e => setData('plant_id', e.target.value)}
                                    className={inputClass}
                                    required
                                >
                                    {plants.map(p => (
                                        <option key={p.id} value={p.id}>{p.nama}</option>
                                    ))}
                                </select>
                                {errors.plant_id && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.plant_id}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Keadaan Tanaman</label>
                                <select
                                    value={data.keadaan}
                                    onChange={e => setData('keadaan', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="sangat_baik">Sangat Baik</option>
                                    <option value="baik">Baik</option>
                                    <option value="sedang">Sedang</option>
                                    <option value="buruk">Buruk</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Part 2: Pilih Fase & Tahap */}
                    <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-md space-y-6">
                        <h2 className="font-bold text-base text-slate-900 border-b border-emerald-100 pb-3 flex items-center justify-between">
                            <span>2. Fase Pertumbuhan Teramati (Bisa &gt; 1)</span>
                            <span className="text-xs text-slate-400 font-normal">Lampiran VIII Golongan B &amp; C</span>
                        </h2>

                        <div className="space-y-4">
                            {phases.map(ph => {
                                const isChecked = !!data.selectedPhases[ph.id];
                                return (
                                    <div key={ph.id} className={`p-4 rounded-xl border transition ${isChecked ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50/50 border-slate-200'}`}>
                                        <div className="flex items-center justify-between flex-wrap gap-3">
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    id={`phase_${ph.id}`}
                                                    checked={isChecked}
                                                    onChange={e => handlePhaseToggle(ph.id, e.target.checked)}
                                                    className="w-5 h-5 rounded accent-emerald-600"
                                                />
                                                <label htmlFor={`phase_${ph.id}`} className="text-sm font-bold text-slate-800 cursor-pointer">
                                                    {ph.nama}
                                                </label>
                                            </div>

                                            {isChecked && (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs font-semibold text-slate-600">Tahap Perkiraan:</span>
                                                    <select
                                                        value={data.selectedPhases[ph.id]}
                                                        onChange={e => handleTahapChange(ph.id, e.target.value)}
                                                        className="bg-white border border-emerald-300 rounded-lg px-3 py-1 text-xs font-bold text-emerald-900 outline-none"
                                                    >
                                                        <option value="mulai">Mulai (&lt;25%)</option>
                                                        <option value="sedang">Sedang (25-75%)</option>
                                                        <option value="selesai">Selesai (&gt;75%)</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Part 3: Keterangan & Foto Opsional */}
                    <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-md space-y-6">
                        <h2 className="font-bold text-base text-slate-900 border-b border-emerald-100 pb-3">
                            3. KeteranganTambahan &amp; Foto Opsional
                        </h2>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Keterangan (Hama, Penyakit, Cuaca)</label>
                            <textarea
                                value={data.keterangan}
                                onChange={e => setData('keterangan', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs placeholder:text-xs outline-none focus:bg-white focus:border-emerald-500 transition font-medium"
                                placeholder="Jelaskan bila ada gangguan hama, penyakit, atau pengaruh cuaca..."
                                rows="3"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">Foto Bukti Tanaman (Opsional)</label>
                            <WatermarkCamera
                                onCapture={base64Img => setData('foto', base64Img)}
                                isSynoptic={false}
                            />
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <Link
                            href={route('phenology.index')}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold transition"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Batal &amp; Kembali</span>
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 text-sm transition disabled:opacity-50 cursor-pointer"
                        >
                            <Send className="w-4 h-4" />
                            <span>{processing ? 'Menyimpan...' : 'Simpan Fenologi Harian'}</span>
                        </button>
                    </div>
                </form>
            </main>
        </Sidebar>
    );
}
