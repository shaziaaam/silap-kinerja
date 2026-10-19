import React, { useMemo, useState } from 'react';
import { Info, Edit3 } from 'lucide-react';
import { hitungUlang, periksa } from '../lib/observationRules';

const AGM1B_SLOTS = ['07:30', '13:30', '17:30'];

// Same rule as InstrumentParameter::isScheduledForSlot() on the server.
export function isScheduledForSlot(param, jam) {
    const isAgm1b = AGM1B_SLOTS.includes(jam);
    const jb = param.jadwal_baca;
    if (!jb || jb.length === 0) return param.kartu !== null && param.kartu <= 7 ? isAgm1b : !isAgm1b;
    if (jb.includes('AGM1B')) return isAgm1b;
    if (jb.includes('HARIAN_0700')) return jam === '07:00';
    if (jb.includes('JAM_PENUH')) return !isAgm1b;
    return false;
}

const CARD_TITLES = {
    1: 'Kartu 1. Psikrometer Sangkar (1,2 m)',
    2: 'Kartu 2. Angin (0,5 m & 10 m)',
    3: 'Kartu 3. OP Penguapan',
    4: 'Kartu 4. Psikrometer Assman',
    5: 'Kartu 5. Piche Penguapan',
    6: 'Kartu 6. Keadaan Tanah, Keadaan Hujan & Keterangan AGM 1-B',
    7: 'Kartu 7. Suhu Tanah (Berumput & Gundul)',
    8: 'Kartu 8. Pengamatan di Luar Tab FDIH',
};

/**
 * Parameter state, auto-calculation and physics checks shared by the create and
 * edit pages.
 */
export function useObservationFields({ instruments, data, setData, jamWibStr, aturanFisika = {} }) {
    const allParams = useMemo(() => {
        const list = [];
        instruments.forEach((inst) => inst.parameters?.forEach((p) => list.push(p)));
        return list.sort((a, b) => (a.kartu ?? 8) - (b.kartu ?? 8) || (a.urutan ?? 0) - (b.urutan ?? 0));
    }, [instruments]);

    const byKode = useMemo(() => {
        const map = {};
        allParams.forEach((p) => { map[p.kode] = p; });
        return map;
    }, [allParams]);

    const visibleParams = useMemo(
        () => allParams.filter((p) => isScheduledForSlot(p, jamWibStr)),
        [allParams, jamWibStr],
    );

    const handleValueChange = (paramId, type, val) => {
        setData((prev) => {
            const values = { ...prev.values, [paramId]: { ...(prev.values[paramId] || {}), [type]: val } };
            return { ...prev, values: hitungUlang(values, byKode, aturanFisika.gunn_bellani_koefisien_default) };
        });
    };

    const issues = useMemo(
        () => (data.status_pengamatan === 'lengkap'
            ? periksa(data.values, visibleParams, aturanFisika)
            : { pesan: [], perParam: {} }),
        [data.values, data.status_pengamatan, visibleParams, aturanFisika],
    );

    return { allParams, visibleParams, handleValueChange, issues };
}

const inputClass = 'w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-slate-900 text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition font-medium';
const invalidClass = 'w-full bg-rose-50 border border-rose-400 rounded-xl px-3 h-9 text-rose-900 text-xs outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200/50 transition font-medium';
const awsClass = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-7 text-slate-700 text-[11px] outline-none placeholder:text-slate-400';
const readonlyClass = 'w-full bg-slate-100 border border-slate-200 rounded-xl px-3 h-9 text-slate-700 text-xs font-semibold outline-none cursor-not-allowed';

export default function ObservationFields({ data, visibleParams, handleValueChange, issues, parameterOptions = {}, jamWibStr }) {
    const [editableSebelum, setEditableSebelum] = useState({});
    const val = (p, type) => data.values[p.id]?.[type] ?? '';
    const isAgm1bSlot = AGM1B_SLOTS.includes(jamWibStr);

    const numberProps = (p) => ({
        type: 'number',
        step: p.tipe_input === 'integer' ? '1' : 'any',
        min: p.batas_min ?? undefined,
        max: p.batas_max ?? undefined,
    });

    const awsInput = (p) => (
        <input
            type="number"
            step="any"
            className={awsClass}
            value={val(p, 'aws')}
            onChange={(e) => handleValueChange(p.id, 'aws', e.target.value)}
            placeholder={`Nilai AWS (${p.kode_aws})`}
        />
    );

    const renderInput = (p) => {
        const salah = issues.perParam[p.id];
        const cls = salah ? invalidClass : inputClass;

        if (!p.is_active) {
            return <input type="text" disabled value="9999 (Nonaktif)" className={readonlyClass} />;
        }
        if (p.sifat === 'dihitung_nasional') {
            return (
                <div className="space-y-1">
                    <input
                        type="text"
                        disabled
                        value="otomatis (dihitung sistem nasional)"
                        className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 h-9 text-emerald-800 text-xs font-semibold italic cursor-not-allowed"
                    />
                    {p.kode_aws && awsInput(p)}
                </div>
            );
        }
        if (p.sifat === 'dihitung_app') {
            return (
                <input
                    type="text"
                    readOnly
                    value={val(p, 'manual')}
                    placeholder="Dihitung otomatis..."
                    className={salah ? invalidClass : 'w-full bg-sky-50 border border-sky-200 rounded-xl px-3 h-9 text-sky-900 text-xs font-bold outline-none'}
                />
            );
        }
        if (p.sifat === 'sebelum') {
            const bisaUbah = editableSebelum[p.id];
            return (
                <div className="flex items-center space-x-2">
                    <input
                        {...numberProps(p)}
                        readOnly={!bisaUbah}
                        value={val(p, 'manual')}
                        onChange={(e) => handleValueChange(p.id, 'manual', e.target.value)}
                        className={bisaUbah ? cls : 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 text-slate-800 text-xs font-semibold'}
                    />
                    <button
                        type="button"
                        onClick={() => setEditableSebelum((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                        title="Ubah nilai sebelum bila alat direset atau diisi ulang"
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition shrink-0 flex items-center space-x-1"
                    >
                        <Edit3 className="w-3 h-3" />
                        <span>{bisaUbah ? 'Kunci' : 'Ubah'}</span>
                    </button>
                </div>
            );
        }
        if (p.tipe_input === 'select') {
            return (
                <select className={cls} value={val(p, 'manual')} onChange={(e) => handleValueChange(p.id, 'manual', e.target.value)}>
                    <option value="">-- Pilih {p.label} --</option>
                    {(parameterOptions[p.kode] || []).map((opt) => (
                        <option key={opt.id} value={opt.nilai}>{opt.label}</option>
                    ))}
                </select>
            );
        }
        if (p.tipe_input === 'text') {
            return (
                <input
                    type="text"
                    className={cls}
                    value={val(p, 'manual')}
                    onChange={(e) => handleValueChange(p.id, 'manual', e.target.value)}
                    placeholder="Keterangan opsional..."
                />
            );
        }
        if (p.sumber === 'aws') {
            return (
                <input
                    type="number"
                    step="any"
                    className={cls}
                    value={val(p, 'aws')}
                    onChange={(e) => handleValueChange(p.id, 'aws', e.target.value)}
                    placeholder={`Nilai AWS (${p.kode_aws})`}
                />
            );
        }
        return (
            <div className="space-y-1">
                <input
                    {...numberProps(p)}
                    className={cls}
                    value={val(p, 'manual')}
                    onChange={(e) => handleValueChange(p.id, 'manual', e.target.value)}
                    placeholder="Nilai manual"
                />
                {p.kode_aws && awsInput(p)}
            </div>
        );
    };

    const cards = [1, 2, 3, 4, 5, 6, 7, 8]
        .map((k) => ({ k, params: visibleParams.filter((p) => (p.kartu ?? 8) === k) }))
        .filter((c) => c.params.length > 0);

    if (cards.length === 0) return null;

    return (
        <div className="space-y-6">
            {cards.some((c) => c.k <= 7) && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center space-x-3 text-sky-900 text-xs">
                    <Info className="w-5 h-5 text-sky-600 shrink-0" />
                    <div>
                        <p className="font-bold">Formulir Laporan Agm 1-b (Tab FDIH Nasional)</p>
                        <p className="text-sky-800">Urutan kartu dan field sama dengan BMKGSoft v2 &gt; Input Data &gt; Klimatologi &gt; FDIH.</p>
                    </div>
                </div>
            )}

            {cards.map(({ k, params }) => (
                <div key={k} className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
                        <span>{CARD_TITLES[k]}</span>
                        <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {k <= 7 && isAgm1bSlot ? 'AGM 1-B' : jamWibStr === '07:00' ? 'JAM_PENUH + HARIAN_0700' : 'JAM_PENUH'}
                        </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {params.map((p) => (
                            <div key={p.id} className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-800 flex items-center space-x-1">
                                        <span>{p.label}</span>
                                        {!p.is_active && (
                                            <span className="text-[9px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">(9999)</span>
                                        )}
                                    </label>
                                    {p.satuan && (
                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                            {p.satuan}
                                        </span>
                                    )}
                                </div>
                                {renderInput(p)}
                                {issues.perParam[p.id] && (
                                    <p className="text-[10px] leading-snug text-rose-600 font-medium">{issues.perParam[p.id]}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
