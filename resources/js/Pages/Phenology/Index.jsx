import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import { Plus, Calendar, User, Info, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

const KEADAAN_BADGES = {
    sangat_baik: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    baik: 'bg-blue-100 text-blue-800 border-blue-300',
    sedang: 'bg-amber-100 text-amber-800 border-amber-300',
    buruk: 'bg-rose-100 text-rose-800 border-rose-300',
};

const TAHAP_LABELS = {
    mulai: 'Mulai (<25%)',
    sedang: 'Sedang (25-75%)',
    selesai: 'Selesai (>75%)',
};

export default function PhenologyIndex({ entries, plants }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;

    return (
        <Sidebar>
            <Head title="Pengamatan Fenologi - SILAP-Kinerja" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {flash?.message && (
                    <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{flash.message}</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            Modul Pengamatan Fenologi
                        </h1>
                        <p className="text-slate-500 text-xs mt-1">
                            Pencatatan perkembangan fase pertumbuhan tanaman (sekali per hari).
                        </p>
                    </div>

                    <Link
                        href={route('phenology.create')}
                        className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition shadow-md shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Input Fenologi Harian</span>
                    </Link>
                </div>

                {/* Grid tanaman terdaftar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {plants.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm text-center">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                                🌿
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">{p.nama}</h3>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold mt-1 inline-block">
                                Master Tanaman
                            </span>
                        </div>
                    ))}
                </div>

                {/* Tabel Entri Fenologi */}
                <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-md">
                    <div className="px-6 py-4 border-b border-emerald-100 font-extrabold text-sm text-slate-900 bg-emerald-50/50 flex items-center justify-between">
                        <span>Riwayat Pengamatan Fenologi ({entries.total} Entri)</span>
                    </div>

                    <div className="divide-y divide-emerald-50">
                        {entries.data.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm font-semibold">
                                Belum ada entri pengamatan fenologi. Klik tombol di atas untuk menginput.
                            </div>
                        )}

                        {entries.data.map(item => (
                            <div key={item.id} className="p-5 hover:bg-emerald-50/30 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="font-extrabold text-base text-slate-900">{item.plant?.nama}</span>
                                        <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </span>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${KEADAAN_BADGES[item.keadaan]}`}>
                                            Keadaan: {item.keadaan.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {/* List Fase */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {item.entry_phases.map(ep => (
                                            <span key={ep.id} className="bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-medium flex items-center space-x-1.5">
                                                <span className="font-bold text-emerald-800">{ep.phase?.nama}</span>
                                                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded font-bold text-slate-500 border border-slate-200">
                                                    {TAHAP_LABELS[ep.tahap]}
                                                </span>
                                            </span>
                                        ))}
                                    </div>

                                    {item.keterangan && (
                                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <strong className="text-slate-800">Catatan:</strong> {item.keterangan}
                                        </p>
                                    )}

                                    <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                                        <User className="w-3 h-3" />
                                        <span>Dicatat oleh: <strong>{item.user?.nama}</strong></span>
                                    </div>
                                </div>

                                {item.foto_path && (
                                    <div className="shrink-0">
                                        <a href={`/${item.foto_path}`} target="_blank" rel="noreferrer">
                                            <img src={`/${item.foto_path}`} alt="Foto Fenologi" className="w-24 h-24 object-cover rounded-xl border border-emerald-200 shadow-sm hover:opacity-90 transition" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </Sidebar>
    );
}
