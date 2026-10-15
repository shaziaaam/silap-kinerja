import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import {
    Wrench, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
    Clock, ToggleLeft, ToggleRight, Save,
    AlertCircle, CheckCircle2, X
} from 'lucide-react';

const KATEGORI_LABELS = {
    aws: 'AWS',
    taman_alat: 'Taman Alat',
};

const SUMBER_LABELS = {
    aws: 'AWS saja',
    manual: 'Manual saja',
    keduanya: 'AWS & Manual',
};

const TIPE_LABELS = {
    number: 'Angka desimal',
    integer: 'Angka bulat',
    select: 'Pilihan',
    text: 'Teks bebas',
    multicheck: 'Centang banyak',
};

function formatJadwal(jadwal) {
    if (!jadwal || jadwal.length === 0) return 'Setiap jam operasional';
    if (jadwal.length === 1) return `Hanya ${jadwal[0].toString().padStart(2,'0')}:00 WIB`;
    return jadwal.map(j => j.toString().padStart(2,'0') + ':00').join(', ') + ' WIB';
}

function Modal({ open, title, onClose, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
            <div className="relative bg-white border border-sky-100 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-base text-slate-900">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

function FormField({ label, error, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
            {children}
            {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
        </div>
    );
}

const inputClass = "w-full border border-slate-200 rounded-xl px-3 h-9 text-slate-900 text-xs placeholder:text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition font-medium bg-white";
const selectClass = inputClass;

function JadwalPicker({ value, onChange, jamMulai = 7, jamSelesai = 22 }) {
    const allHours = Array.from({ length: jamSelesai - jamMulai + 1 }, (_, i) => jamMulai + i);

    const handleToggleHour = (h) => {
        if (value === null) {
            onChange(allHours.filter(x => x !== h));
        } else {
            const next = value.includes(h) ? value.filter(x => x !== h) : [...value, h].sort((a, b) => a - b);
            onChange(next.length === 0 ? null : next);
        }
    };

    const isSelected = (h) => value === null || value.includes(h);

    return (
        <div>
            <div className="flex gap-2 mb-3 flex-wrap">
                {[
                    { label: 'Setiap jam', val: null },
                    { label: '3x sehari (07,13,17)', val: [7, 13, 17] },
                    { label: 'Harian (07)', val: [7] },
                    { label: 'Hanya 17:00', val: [17] },
                ].map(preset => (
                    <button
                        key={preset.label}
                        type="button"
                        onClick={() => onChange(preset.val)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                            JSON.stringify(value) === JSON.stringify(preset.val)
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400'
                        }`}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {allHours.map(h => (
                    <button
                        key={h}
                        type="button"
                        onClick={() => handleToggleHour(h)}
                        className={`w-12 h-8 rounded-lg text-xs font-bold border transition ${
                            isSelected(h)
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-white text-slate-400 border-slate-200 hover:border-sky-300'
                        }`}
                    >
                        {h.toString().padStart(2, '0')}
                    </button>
                ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
                {value === null ? 'Semua jam operasional' : `Terpilih: ${value.map(j => j.toString().padStart(2,'0')+':00').join(', ')}`}
            </p>
        </div>
    );
}

export default function Instruments({ instruments, settings }) {
    const [expandedId, setExpandedId] = useState(null);
    const [flash, setFlash] = useState(null);

    const [instrModal, setInstrModal] = useState({ open: false, mode: 'create', data: null });
    const instrForm = useForm({
        nama: '', kategori: 'taman_alat', is_active: true, urutan_form: 0,
    });

    const openInstrCreate = () => {
        instrForm.reset();
        instrForm.setData({ nama: '', kategori: 'taman_alat', is_active: true, urutan_form: 0 });
        setInstrModal({ open: true, mode: 'create', data: null });
    };

    const openInstrEdit = (instr) => {
        instrForm.setData({
            nama: instr.nama, kategori: instr.kategori,
            is_active: instr.is_active, urutan_form: instr.urutan_form,
        });
        setInstrModal({ open: true, mode: 'edit', data: instr });
    };

    const submitInstr = (e) => {
        e.preventDefault();
        if (instrModal.mode === 'create') {
            instrForm.post(route('admin.instruments.store'), {
                onSuccess: () => { setInstrModal({ open: false }); setFlash('Alat berhasil ditambahkan.'); }
            });
        } else {
            instrForm.put(route('admin.instruments.update', instrModal.data.id), {
                onSuccess: () => { setInstrModal({ open: false }); setFlash('Alat berhasil diperbarui.'); }
            });
        }
    };

    const deleteInstr = (instr) => {
        if (!confirm(`Hapus alat "${instr.nama}"? Semua parameter dan data terkait akan hilang.`)) return;
        router.delete(route('admin.instruments.destroy', instr.id), {
            onSuccess: () => setFlash('Alat berhasil dihapus.'),
        });
    };

    const toggleActive = (instr) => {
        router.put(route('admin.instruments.update', instr.id), {
            ...instr, is_active: !instr.is_active
        }, { onSuccess: () => setFlash(`Alat "${instr.nama}" ${!instr.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`) });
    };

    const [paramModal, setParamModal] = useState({ open: false, mode: 'create', data: null, instrId: null });
    const paramForm = useForm({
        kode: '', label: '', satuan: '', tipe_input: 'number',
        batas_min: '', batas_max: '', sumber: 'keduanya',
        jadwal_baca: null, urutan: 0, faktor_konversi: '', is_active: true,
    });

    const openParamCreate = (instrId) => {
        paramForm.reset();
        paramForm.setData({
            kode: '', label: '', satuan: '', tipe_input: 'number',
            batas_min: '', batas_max: '', sumber: 'keduanya',
            jadwal_baca: null, urutan: 0, faktor_konversi: '', is_active: true,
        });
        setParamModal({ open: true, mode: 'create', data: null, instrId });
    };

    const openParamEdit = (param) => {
        paramForm.setData({
            kode: param.kode, label: param.label, satuan: param.satuan ?? '',
            tipe_input: param.tipe_input, batas_min: param.batas_min ?? '',
            batas_max: param.batas_max ?? '', sumber: param.sumber,
            jadwal_baca: param.jadwal_baca, urutan: param.urutan ?? 0,
            faktor_konversi: param.faktor_konversi ?? '',
            is_active: param.is_active ?? true,
        });
        setParamModal({ open: true, mode: 'edit', data: param, instrId: param.instrument_id });
    };

    const toggleParamActive = (param) => {
        router.put(route('admin.instruments.parameters.update', param.id), {
            ...param,
            is_active: param.is_active === undefined ? false : !param.is_active,
        }, {
            onSuccess: () => setFlash(`Parameter "${param.label}" ${param.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`)
        });
    };

    const submitParam = (e) => {
        e.preventDefault();
        if (paramModal.mode === 'create') {
            paramForm.post(route('admin.instruments.parameters.store', paramModal.instrId), {
                onSuccess: () => { setParamModal({ open: false }); setFlash('Parameter berhasil ditambahkan.'); }
            });
        } else {
            paramForm.put(route('admin.instruments.parameters.update', paramModal.data.id), {
                onSuccess: () => { setParamModal({ open: false }); setFlash('Parameter berhasil diperbarui.'); }
            });
        }
    };

    const deleteParam = (param) => {
        if (!confirm(`Hapus parameter "${param.label}"?`)) return;
        router.delete(route('admin.instruments.parameters.destroy', param.id), {
            onSuccess: () => setFlash('Parameter berhasil dihapus.'),
        });
    };

    const [settingsModal, setSettingsModal] = useState(false);
    const settingsForm = useForm({
        jam_mulai: settings.jam_mulai,
        jam_selesai: settings.jam_selesai,
        hujan_slot_awal: settings.hujan_slot_awal ?? 8,
    });

    const submitSettings = (e) => {
        e.preventDefault();
        settingsForm.post(route('admin.instruments.settings.update'), {
            onSuccess: () => { setSettingsModal(false); setFlash('Pengaturan disimpan.'); }
        });
    };

    return (
        <Sidebar>
            <Head title="Kelola Alat - SILAP-Kinerja" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {flash && (
                    <div className="mb-4 flex items-center space-x-2 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl px-4 py-3 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-600" />
                        <span>{flash}</span>
                        <button onClick={() => setFlash(null)} className="ml-auto text-sky-600 hover:text-sky-800"><X className="w-4 h-4" /></button>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Kelola Alat Pengamatan</h1>
                        <p className="text-slate-500 text-xs mt-0.5">
                            Pengaturan instrumen pengamatan, daftar parameter, dan jadwal pembacaan data.
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                        <button
                            onClick={() => setSettingsModal(true)}
                            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                        >
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Jam Operasional: {settings.jam_mulai.toString().padStart(2,'0')}:00–{settings.jam_selesai.toString().padStart(2,'0')}:00 WIB</span>
                        </button>
                        <button
                            onClick={openInstrCreate}
                            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition shadow-sm shadow-sky-600/20"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Alat</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {instruments.length === 0 && (
                        <div className="text-center py-16 text-slate-400">
                            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30 text-sky-600" />
                            <p className="font-semibold">Belum ada alat. Tambahkan alat pertama.</p>
                        </div>
                    )}

                    {instruments.map(instr => (
                        <div key={instr.id} className="bg-white rounded-2xl border border-sky-100/80 shadow-sm shadow-sky-100/30 overflow-hidden">
                            <div
                                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-sky-50/40 transition"
                                onClick={() => setExpandedId(expandedId === instr.id ? null : instr.id)}
                            >
                                <div className="flex items-center space-x-3 min-w-0">
                                    <div className={`w-3 h-3 rounded-full shrink-0 ${instr.is_active ? 'bg-sky-500' : 'bg-slate-300'}`} />
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-900 text-sm truncate">{instr.nama}</div>
                                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                                            {KATEGORI_LABELS[instr.kategori]} · {instr.parameters?.length ?? 0} parameter · Urutan kategori: {instr.urutan_form}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); toggleActive(instr); }}
                                        title={instr.is_active ? 'Nonaktifkan alat ini' : 'Aktifkan alat ini'}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            instr.is_active ? 'bg-sky-600' : 'bg-slate-300'
                                        }`}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                instr.is_active ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); openInstrEdit(instr); }}
                                        className="p-1 text-sky-600 hover:text-sky-800 hover:scale-110 transition cursor-pointer"
                                        title="Edit alat"
                                    >
                                        <Pencil className="w-5 h-5" strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); deleteInstr(instr); }}
                                        className="p-1 text-rose-600 hover:text-rose-700 hover:scale-110 transition cursor-pointer"
                                        title="Hapus alat"
                                    >
                                        <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                                    </button>
                                    {expandedId === instr.id
                                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                        : <ChevronRight className="w-4 h-4 text-slate-400" />
                                    }
                                </div>
                            </div>

                            {expandedId === instr.id && (
                                <div className="border-t border-sky-100 bg-sky-50/20 px-5 py-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-semibold text-slate-700">Daftar Parameter</h4>
                                        <button
                                            onClick={() => openParamCreate(instr.id)}
                                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm shadow-sky-600/20"
                                        >
                                            <Plus className="w-3 h-3" />
                                            <span>Tambah Parameter</span>
                                        </button>
                                    </div>

                                    {(!instr.parameters || instr.parameters.length === 0) && (
                                        <p className="text-xs text-slate-400 py-4 text-center">Belum ada parameter. Tambahkan parameter pertama.</p>
                                    )}

                                    <div className="space-y-2">
                                        {(instr.parameters ?? []).map(param => (
                                            <div key={param.id} className={`bg-white rounded-xl border border-sky-100 px-4 py-3 flex items-start justify-between gap-3 transition ${param.is_active === false ? 'opacity-60 bg-slate-50/80 border-dashed' : ''}`}>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`font-bold text-sm ${param.is_active === false ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{param.label}</span>
                                                        {param.is_active === false && (
                                                            <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded font-bold">Nonaktif</span>
                                                        )}
                                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                                                            param.sumber === 'aws' ? 'bg-sky-50 text-sky-700 border-sky-200'
                                                            : param.sumber === 'manual' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                        }`}>
                                                            {SUMBER_LABELS[param.sumber]}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-3">
                                                        <span>kode: <span className="font-mono text-slate-600">{param.kode}</span></span>
                                                        <span>input: {TIPE_LABELS[param.tipe_input]}</span>
                                                        {(param.batas_min !== null || param.batas_max !== null) && (
                                                            <span>batas: {param.batas_min ?? '–'} s/d {param.batas_max ?? '–'}</span>
                                                        )}
                                                        <span className="flex items-center space-x-1">
                                                            <Clock className="w-3 h-3 text-slate-400" />
                                                            <span>{formatJadwal(param.jadwal_baca)}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleParamActive(param)}
                                                        title={param.is_active !== false ? 'Nonaktifkan parameter ini' : 'Aktifkan parameter ini'}
                                                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                            param.is_active !== false ? 'bg-sky-600' : 'bg-slate-300'
                                                        }`}
                                                    >
                                                        <span
                                                            aria-hidden="true"
                                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                param.is_active !== false ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                    <button
                                                        onClick={() => openParamEdit(param)}
                                                        className="p-1 text-sky-600 hover:text-sky-800 hover:scale-110 transition cursor-pointer"
                                                        title="Edit parameter"
                                                    >
                                                        <Pencil className="w-4 h-4" strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteParam(param)}
                                                        className="p-1 text-rose-600 hover:text-rose-700 hover:scale-110 transition cursor-pointer"
                                                        title="Hapus parameter"
                                                    >
                                                        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </main>

            <Modal
                open={instrModal.open}
                title={instrModal.mode === 'create' ? 'Tambah Alat Baru' : 'Edit Alat'}
                onClose={() => setInstrModal({ open: false })}
            >
                <form onSubmit={submitInstr} className="space-y-4">
                    <FormField label="Nama Alat / Card" error={instrForm.errors.nama}>
                        <input
                            type="text"
                            className={inputClass}
                            value={instrForm.data.nama}
                            onChange={e => instrForm.setData('nama', e.target.value)}
                            placeholder="Contoh: Taman Alat (Manual)"
                            required
                        />
                    </FormField>
                    <FormField label="Kategori" error={instrForm.errors.kategori}>
                        <select
                            className={selectClass}
                            value={instrForm.data.kategori}
                            onChange={e => instrForm.setData('kategori', e.target.value)}
                        >
                            <option value="taman_alat">Taman Alat (Manual)</option>
                            <option value="aws">Data AWS</option>
                        </select>
                    </FormField>
                    <FormField label="Urutan Card di Form" error={instrForm.errors.urutan_form}>
                        <input
                            type="number"
                            min="0"
                            className={inputClass}
                            value={instrForm.data.urutan_form}
                            onChange={e => instrForm.setData('urutan_form', parseInt(e.target.value))}
                        />
                    </FormField>
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="is_active_instr"
                            checked={instrForm.data.is_active}
                            onChange={e => instrForm.setData('is_active', e.target.checked)}
                            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                        />
                        <label htmlFor="is_active_instr" className="text-sm font-semibold text-slate-700">Alat aktif (tampil di form observasi)</label>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setInstrModal({ open: false })} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">Batal</button>
                        <button type="submit" disabled={instrForm.processing} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition flex items-center space-x-2 shadow-sm shadow-sky-600/20">
                            <Save className="w-4 h-4" />
                            <span>{instrForm.processing ? 'Menyimpan...' : 'Simpan'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={paramModal.open}
                title={paramModal.mode === 'create' ? 'Tambah Parameter' : 'Edit Parameter'}
                onClose={() => setParamModal({ open: false })}
            >
                <form onSubmit={submitParam} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Kode (unik)" error={paramForm.errors.kode}>
                            <input
                                type="text"
                                className={inputClass}
                                value={paramForm.data.kode}
                                onChange={e => paramForm.setData('kode', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                placeholder="mis: suhu_bola_kering"
                                required
                            />
                        </FormField>
                        <FormField label="Satuan" error={paramForm.errors.satuan}>
                            <input
                                type="text"
                                className={inputClass}
                                value={paramForm.data.satuan}
                                onChange={e => paramForm.setData('satuan', e.target.value)}
                                placeholder="mis: °C, mm, ml, knot"
                            />
                        </FormField>
                    </div>
                    <FormField label="Label (tampil di form & PDF)" error={paramForm.errors.label}>
                        <input
                            type="text"
                            className={inputClass}
                            value={paramForm.data.label}
                            onChange={e => paramForm.setData('label', e.target.value)}
                            placeholder="Suhu Bola Kering"
                            required
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Tipe Input" error={paramForm.errors.tipe_input}>
                            <select className={selectClass} value={paramForm.data.tipe_input} onChange={e => paramForm.setData('tipe_input', e.target.value)}>
                                {Object.entries(TIPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Sumber Data" error={paramForm.errors.sumber}>
                            <select className={selectClass} value={paramForm.data.sumber} onChange={e => paramForm.setData('sumber', e.target.value)}>
                                <option value="aws">AWS saja</option>
                                <option value="manual">Manual saja</option>
                                <option value="keduanya">AWS & Manual</option>
                            </select>
                        </FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Urutan Single (Form & PDF)" error={paramForm.errors.urutan}>
                            <input type="number" min="0" className={inputClass} value={paramForm.data.urutan} onChange={e => paramForm.setData('urutan', parseInt(e.target.value) || 0)} />
                        </FormField>
                        <FormField label="Faktor Konversi (Opsional)" error={paramForm.errors.faktor_konversi}>
                            <input type="number" step="any" className={inputClass} value={paramForm.data.faktor_konversi} onChange={e => paramForm.setData('faktor_konversi', e.target.value)} placeholder="mis: 1.0" />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Batas Min" error={paramForm.errors.batas_min}>
                            <input type="number" step="any" className={inputClass} value={paramForm.data.batas_min} onChange={e => paramForm.setData('batas_min', e.target.value)} placeholder="Kosong = tak terbatas" />
                        </FormField>
                        <FormField label="Batas Maks" error={paramForm.errors.batas_max}>
                            <input type="number" step="any" className={inputClass} value={paramForm.data.batas_max} onChange={e => paramForm.setData('batas_max', e.target.value)} placeholder="Kosong = tak terbatas" />
                        </FormField>
                    </div>
                    <FormField label="Jadwal Baca" error={paramForm.errors.jadwal_baca}>
                        <JadwalPicker
                            value={paramForm.data.jadwal_baca}
                            onChange={v => paramForm.setData('jadwal_baca', v)}
                        />
                    </FormField>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setParamModal({ open: false })} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">Batal</button>
                        <button type="submit" disabled={paramForm.processing} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition flex items-center space-x-2 shadow-sm shadow-sky-600/20">
                            <Save className="w-4 h-4" />
                            <span>{paramForm.processing ? 'Menyimpan...' : 'Simpan'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={settingsModal} title="Pengaturan Jam Operasional" onClose={() => setSettingsModal(false)}>
                <form onSubmit={submitSettings} className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Jam operasional menentukan pilihan jam di form observasi dan validasi jadwal baca parameter.</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Jam Mulai (WIB)" error={settingsForm.errors.jam_mulai}>
                            <input
                                type="number" min="0" max="23"
                                className={inputClass}
                                value={settingsForm.data.jam_mulai}
                                onChange={e => settingsForm.setData('jam_mulai', parseInt(e.target.value))}
                            />
                        </FormField>
                        <FormField label="Jam Selesai (WIB)" error={settingsForm.errors.jam_selesai}>
                            <input
                                type="number" min="0" max="23"
                                className={inputClass}
                                value={settingsForm.data.jam_selesai}
                                onChange={e => settingsForm.setData('jam_selesai', parseInt(e.target.value))}
                            />
                        </FormField>
                    </div>
                    <FormField label="Slot Awal Penjumlahan Hujan (WIB)" error={settingsForm.errors.hujan_slot_awal}>
                        <input
                            type="number" min="0" max="23"
                            className={inputClass}
                            value={settingsForm.data.hujan_slot_awal}
                            onChange={e => settingsForm.setData('hujan_slot_awal', parseInt(e.target.value))}
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Default 8 (slot 08.00 mencakup hujan 07.00-08.00 hari itu).</p>
                    </FormField>
                    <p className="text-xs text-slate-500">Standar: 07:00–22:00 WIB (16 slot per hari).</p>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setSettingsModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">Batal</button>
                        <button type="submit" disabled={settingsForm.processing} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition flex items-center space-x-2 shadow-sm shadow-sky-600/20">
                            <Save className="w-4 h-4" />
                            <span>Simpan</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </Sidebar>
    );
}
