import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import {
    Wrench, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
    Clock, ToggleLeft, ToggleRight, Save,
    AlertCircle, CheckCircle2, X, ListChecks
} from 'lucide-react';

/**
 * Kelola Alat > Pilihan: choices of the dropdown fields (Keadaan Tanah, Keadaan Hujan),
 * copied by the admin from the national system's dropdowns.
 */
function PanelPilihan({ parameterPilihan = [], pilihan = {}, onFlash }) {
    const [baru, setBaru] = useState({});
    const [edit, setEdit] = useState(null); // { id, nilai, urutan }
    const [hapus, setHapus] = useState(null);
    const [errors, setErrors] = useState({});

    const tambah = (kode) => {
        router.post(route('admin.instruments.options.store'), { parameter_kode: kode, nilai: baru[kode] || '' }, {
            preserveScroll: true,
            onSuccess: () => { setBaru((b) => ({ ...b, [kode]: '' })); setErrors({}); onFlash('Pilihan ditambahkan.'); },
            onError: (e) => setErrors({ [kode]: e.nilai || e.parameter_kode }),
        });
    };
    const simpan = () => {
        router.put(route('admin.instruments.options.update', edit.id), { nilai: edit.nilai, urutan: edit.urutan }, {
            preserveScroll: true,
            onSuccess: () => { setEdit(null); setErrors({}); onFlash('Pilihan diperbarui.'); },
            onError: (e) => setErrors({ [`edit${edit.id}`]: e.nilai || e.urutan }),
        });
    };
    const hapusPilihan = (id) => {
        router.delete(route('admin.instruments.options.destroy', id), {
            preserveScroll: true,
            onSuccess: () => { setHapus(null); onFlash('Pilihan dihapus.'); },
        });
    };

    if (parameterPilihan.length === 0) return null;

    const input = 'bg-white border border-slate-200 rounded-lg px-2.5 h-8 text-xs outline-none focus:border-sky-500';

    return (
        <div className="mt-8 bg-white border border-sky-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-sky-100 bg-sky-50/60 flex items-start space-x-2">
                <ListChecks className="w-4 h-4 text-sky-700 mt-0.5" />
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Pilihan Dropdown</h2>
                    <p className="text-[11px] text-slate-500">Samakan dengan isi dropdown di BMKGSoft v2. Mengubah atau menghapus pilihan tidak mengubah data observasi yang sudah tersimpan.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-sky-50">
                {parameterPilihan.map((p) => (
                    <div key={p.id} className="p-5 space-y-3">
                        <div className="text-xs font-bold text-slate-800">{p.label}</div>
                        <ul className="space-y-1.5">
                            {(pilihan[p.kode] || []).map((o) => (
                                <li key={o.id} className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs py-1">
                                    {edit?.id === o.id ? (
                                        <>
                                            <input type="number" min="0" className={`${input} w-16`} value={edit.urutan}
                                                onChange={(e) => setEdit({ ...edit, urutan: e.target.value })} title="Urutan" />
                                            <input className={`${input} flex-1 min-w-[120px]`} value={edit.nilai}
                                                onChange={(e) => setEdit({ ...edit, nilai: e.target.value })} />
                                            <button type="button" onClick={simpan} className="p-2 rounded-lg bg-sky-600 text-white min-h-[32px] min-w-[32px] flex items-center justify-center" title="Simpan"><Save className="w-3.5 h-3.5" /></button>
                                            <button type="button" onClick={() => setEdit(null)} className="p-2 rounded-lg bg-slate-100 text-slate-600 min-h-[32px] min-w-[32px] flex items-center justify-center" title="Batal"><X className="w-3.5 h-3.5" /></button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-6 text-right text-slate-400 font-mono shrink-0">{o.urutan}</span>
                                            <span className="flex-1 font-semibold text-slate-800 break-words">{o.nilai}</span>
                                            {hapus === o.id ? (
                                                <div className="flex items-center space-x-1 shrink-0">
                                                    <span className="text-rose-600 font-semibold text-[11px]">Hapus?</span>
                                                    <button type="button" onClick={() => hapusPilihan(o.id)} className="px-2 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs">Ya</button>
                                                    <button type="button" onClick={() => setHapus(null)} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs">Batal</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-1 shrink-0">
                                                    <button type="button" onClick={() => setEdit({ id: o.id, nilai: o.nilai, urutan: o.urutan })} className="p-1.5 rounded-lg hover:bg-sky-50 text-sky-700" title="Ubah"><Pencil className="w-3.5 h-3.5" /></button>
                                                    <button type="button" onClick={() => setHapus(o.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </li>
                            ))}
                            {(pilihan[p.kode] || []).length === 0 && <li className="text-[11px] text-slate-400 italic">Belum ada pilihan.</li>}
                        </ul>
                        {errors[`edit${edit?.id}`] && <p className="text-[11px] text-rose-600">{errors[`edit${edit?.id}`]}</p>}
                        <div className="flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center gap-2 pt-1">
                            <input className={`${input} flex-1`} placeholder="Pilihan baru, salin dari BMKGSoft"
                                value={baru[p.kode] || ''}
                                onChange={(e) => setBaru({ ...baru, [p.kode]: e.target.value })}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); tambah(p.kode); } }} />
                            <button type="button" onClick={() => tambah(p.kode)} className="px-3 h-8 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1 min-h-[36px] min-[420px]:min-h-0">
                                <Plus className="w-3.5 h-3.5" /> Tambah
                            </button>
                        </div>
                        {errors[p.kode] && <p className="text-[11px] text-rose-600">{errors[p.kode]}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}

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
            <div className="relative bg-white border border-sky-100 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] max-h-[90dvh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-base text-slate-900">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="px-4 sm:px-6 py-5">{children}</div>
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

const KELOMPOK_JADWAL = [
    { val: 'JAM_PENUH',   label: 'Jam penuh',     hint: '07.00 - 22.00, tiap jam (16 slot)' },
    { val: 'AGM1B',       label: 'AGM 1-B',       hint: '07.30, 13.30, 17.30 - kartu 1-7 tab FDIH' },
    { val: 'HARIAN_0700', label: 'Harian 07.00',  hint: 'hanya slot 07.00' },
];

function JadwalPicker({ value, onChange }) {
    // Stored as an array of group codes, read by InstrumentParameter::isScheduledForSlot().
    const selected = Array.isArray(value) ? value[0] ?? null : value ?? null;

    return (
        <div className="space-y-2">
            {KELOMPOK_JADWAL.map(k => (
                <button
                    key={k.val}
                    type="button"
                    onClick={() => onChange([k.val])}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition ${
                        selected === k.val
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400'
                    }`}
                >
                    <span className="block text-xs font-bold">{k.label}</span>
                    <span className={`block text-[11px] ${selected === k.val ? 'text-sky-100' : 'text-slate-400'}`}>{k.hint}</span>
                </button>
            ))}
        </div>
    );
}

export default function Instruments({ instruments, settings, parameterPilihan = [], pilihan = {} }) {
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
        jadwal_baca: ['JAM_PENUH'], urutan: 0, faktor_konversi: '', is_active: true,
        kartu: 8, sifat: 'input', kode_aws: '', koefisien: '', opsional: false,
    });

    const openParamCreate = (instrId) => {
        paramForm.reset();
        paramForm.setData({
            kode: '', label: '', satuan: '', tipe_input: 'number',
            batas_min: '', batas_max: '', sumber: 'keduanya',
            jadwal_baca: ['JAM_PENUH'], urutan: 0, faktor_konversi: '', is_active: true,
            kartu: 8, sifat: 'input', kode_aws: '', koefisien: '', opsional: false,
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
            kartu: param.kartu ?? 8, sifat: param.sifat ?? 'input',
            kode_aws: param.kode_aws ?? '', koefisien: param.koefisien ?? '',
            opsional: param.opsional ?? false,
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
        hujan_slot_awal: settings.hujan_slot_awal ?? 7,
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

            <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
                {flash && (
                    <div className="mb-4 flex items-center space-x-2 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl px-4 py-3 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-600" />
                        <span>{flash}</span>
                        <button onClick={() => setFlash(null)} className="ml-auto text-sky-600 hover:text-sky-800"><X className="w-4 h-4" /></button>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Kelola Alat Pengamatan</h1>
                        <p className="text-slate-500 text-xs mt-0.5">
                            Pengaturan instrumen pengamatan, daftar parameter, dan jadwal pembacaan data.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
                        <button
                            onClick={() => setSettingsModal(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition min-h-[40px]"
                        >
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">Jam: {settings.jam_mulai.toString().padStart(2,'0')}:00–{settings.jam_selesai.toString().padStart(2,'0')}:00 WIB</span>
                        </button>
                        <button
                            onClick={openInstrCreate}
                            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition shadow-sm shadow-sky-600/20 min-h-[40px]"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Alat</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-3.5 sm:space-y-4">
                    {instruments.length === 0 && (
                        <div className="text-center py-16 text-slate-400">
                            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30 text-sky-600" />
                            <p className="font-semibold">Belum ada alat. Tambahkan alat pertama.</p>
                        </div>
                    )}

                    {instruments.map(instr => (
                        <div key={instr.id} className="bg-white rounded-2xl border border-sky-100/80 shadow-sm shadow-sky-100/30 overflow-hidden">
                            <div
                                className="flex items-center justify-between px-3.5 sm:px-5 py-3.5 sm:py-4 cursor-pointer hover:bg-sky-50/40 transition gap-2"
                                onClick={() => setExpandedId(expandedId === instr.id ? null : instr.id)}
                            >
                                <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                                    <div className={`w-3 h-3 rounded-full shrink-0 ${instr.is_active ? 'bg-sky-500' : 'bg-slate-300'}`} />
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-900 text-sm truncate">{instr.nama}</div>
                                        <div className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                                            {KATEGORI_LABELS[instr.kategori]} · {instr.parameters?.length ?? 0} param · Urutan: {instr.urutan_form}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
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
                                        className="p-1.5 text-sky-600 hover:text-sky-800 hover:scale-110 transition cursor-pointer"
                                        title="Edit alat"
                                    >
                                        <Pencil className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); deleteInstr(instr); }}
                                        className="p-1.5 text-rose-600 hover:text-rose-700 hover:scale-110 transition cursor-pointer"
                                        title="Hapus alat"
                                    >
                                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                                    </button>
                                    {expandedId === instr.id
                                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                        : <ChevronRight className="w-4 h-4 text-slate-400" />
                                    }
                                </div>
                            </div>

                            {expandedId === instr.id && (
                                <div className="border-t border-sky-100 bg-sky-50/20 px-3.5 sm:px-5 py-3.5 sm:py-4">
                                    <div className="flex items-center justify-between mb-3 gap-2">
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
                                            <div key={param.id} className={`bg-white rounded-xl border border-sky-100 p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3 transition ${param.is_active === false ? 'opacity-60 bg-slate-50/80 border-dashed' : ''}`}>
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
                                                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2.5 sm:gap-3">
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
                                                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto pt-1 sm:pt-0">
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

                <PanelPilihan parameterPilihan={parameterPilihan} pilihan={pilihan} onFlash={setFlash} />
            </div>

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
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                        <button type="button" onClick={() => setInstrModal({ open: false })} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl border border-slate-200 text-slate-600 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition text-center min-h-[40px]">Batal</button>
                        <button type="submit" disabled={instrForm.processing} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-sm shadow-sky-600/20 min-h-[40px]">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Urutan Single (Form & PDF)" error={paramForm.errors.urutan}>
                            <input type="number" min="0" className={inputClass} value={paramForm.data.urutan} onChange={e => paramForm.setData('urutan', parseInt(e.target.value) || 0)} />
                        </FormField>
                        <FormField label="Faktor Konversi (Opsional)" error={paramForm.errors.faktor_konversi}>
                            <input type="number" step="any" className={inputClass} value={paramForm.data.faktor_konversi} onChange={e => paramForm.setData('faktor_konversi', e.target.value)} placeholder="mis: 1.0" />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Batas Min" error={paramForm.errors.batas_min}>
                            <input type="number" step="any" className={inputClass} value={paramForm.data.batas_min} onChange={e => paramForm.setData('batas_min', e.target.value)} placeholder="Kosong = tak terbatas" />
                        </FormField>
                        <FormField label="Batas Maks" error={paramForm.errors.batas_max}>
                            <input type="number" step="any" className={inputClass} value={paramForm.data.batas_max} onChange={e => paramForm.setData('batas_max', e.target.value)} placeholder="Kosong = tak terbatas" />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Kartu (1-7 FDIH, 8 luar FDIH)" error={paramForm.errors.kartu}>
                            <input type="number" min="1" max="8" className={inputClass} value={paramForm.data.kartu} onChange={e => paramForm.setData('kartu', parseInt(e.target.value) || 8)} />
                        </FormField>
                        <FormField label="Sifat Field" error={paramForm.errors.sifat}>
                            <select className={selectClass} value={paramForm.data.sifat} onChange={e => paramForm.setData('sifat', e.target.value)}>
                                <option value="input">Input pengamat</option>
                                <option value="sebelum">Terisi dari pembacaan sebelumnya</option>
                                <option value="dihitung_app">Dihitung aplikasi</option>
                                <option value="dihitung_nasional">Dihitung sistem nasional</option>
                            </select>
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Kode AWS (Opsional)" error={paramForm.errors.kode_aws}>
                            <input type="text" className={inputClass} value={paramForm.data.kode_aws} onChange={e => paramForm.setData('kode_aws', e.target.value)} placeholder="mis: TA_meas, RH_meas" />
                        </FormField>
                        <FormField label="Koefisien Kalibrasi (Opsional)" error={paramForm.errors.koefisien}>
                            <input type="number" step="any" className={inputClass} value={paramForm.data.koefisien} onChange={e => paramForm.setData('koefisien', e.target.value)} placeholder="Gunn-Bellani: 20.8" />
                        </FormField>
                    </div>
                    <label className="flex items-center space-x-2 text-sm text-slate-600">
                        <input type="checkbox" checked={paramForm.data.opsional} onChange={e => paramForm.setData('opsional', e.target.checked)} className="rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                        <span>Field opsional (boleh dikosongkan pengamat)</span>
                    </label>
                    <FormField label="Jadwal Baca" error={paramForm.errors.jadwal_baca}>
                        <JadwalPicker
                            value={paramForm.data.jadwal_baca}
                            onChange={v => paramForm.setData('jadwal_baca', v)}
                        />
                    </FormField>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                        <button type="button" onClick={() => setParamModal({ open: false })} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl border border-slate-200 text-slate-600 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition text-center min-h-[40px]">Batal</button>
                        <button type="submit" disabled={paramForm.processing} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-sm shadow-sky-600/20 min-h-[40px]">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                        <button type="button" onClick={() => setSettingsModal(false)} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl border border-slate-200 text-slate-600 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition text-center min-h-[40px]">Batal</button>
                        <button type="submit" disabled={settingsForm.processing} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-sm shadow-sky-600/20 min-h-[40px]">
                            <Save className="w-4 h-4" />
                            <span>Simpan</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </Sidebar>
    );
}
