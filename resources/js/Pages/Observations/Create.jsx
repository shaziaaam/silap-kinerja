import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import WatermarkCamera from '../../Components/WatermarkCamera';
import { ArrowLeft, Send, Thermometer, Wind, Droplets, Compass, CloudRain, Sun, Gauge, AlertTriangle, Info, Edit3, Camera } from 'lucide-react';

export default function CreateObservation({ schedules = [], instruments = [], parameterOptions = {}, previousValues = {}, settings = {} }) {
    const getNearestScheduleId = (scheduleList) => {
        if (!scheduleList || scheduleList.length === 0) return '';

        const now = new Date();
        const wibStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false });
        const parts = wibStr.split(':');
        const currentHour = parseInt(parts[0], 10);
        const currentMinute = parseInt(parts[1], 10);

        // Check if there is a match in schedules
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        let closest = scheduleList[0];
        let minDiff = Infinity;

        scheduleList.forEach(s => {
            const [sh, sm] = s.jam_wib.split(':').map(Number);
            const slotMinutes = sh * 60 + sm;
            const diff = Math.abs(currentTotalMinutes - slotMinutes);
            if (diff < minDiff) {
                minDiff = diff;
                closest = s;
            }
        });

        return closest ? closest.id : (scheduleList[0]?.id || '');
    };

    const initialScheduleId = getNearestScheduleId(schedules);

    // Initialise values with auto-fetch "Sebelum" where applicable
    const initialValues = {};
    instruments.forEach(inst => {
        inst.parameters?.forEach(p => {
            let defaultVal = '';
            if (p.sifat === 'sebelum' && previousValues[p.kode] !== undefined) {
                defaultVal = previousValues[p.kode];
            }
            initialValues[p.id] = {
                manual: defaultVal,
                aws: '',
            };
        });
    });

    const { data, setData, post, processing, errors } = useForm({
        schedule_id: initialScheduleId,
        tanggal: new Date().toISOString().split('T')[0],
        status_pengamatan: 'lengkap',
        alasan_batal: '',
        values: initialValues,
        foto: null,
    });

    const selectedSchedule = schedules.find(s => String(s.id) === String(data.schedule_id));
    const jamWibStr = selectedSchedule ? selectedSchedule.jam_wib.substring(0, 5) : '07:00';
    const isAgm1bSlot = ['07:30', '13:30', '17:30'].includes(jamWibStr);
    const isMandatoryPhoto = (settings.foto_slots || ['07:00', '17:00']).includes(jamWibStr);

    // Editable state for "Sebelum" fields
    const [editableSebelum, setEditableSebelum] = useState({});

    const toggleEditSebelum = (paramId) => {
        setEditableSebelum(prev => ({
            ...prev,
            [paramId]: !prev[paramId]
        }));
    };

    // Flatten parameters map by code & by id
    const allParams = useMemo(() => {
        const list = [];
        instruments.forEach(inst => {
            inst.parameters?.forEach(p => list.push(p));
        });
        return list;
    }, [instruments]);

    const paramMapById = useMemo(() => {
        const map = {};
        allParams.forEach(p => { map[p.id] = p; });
        return map;
    }, [allParams]);

    const paramMapByCode = useMemo(() => {
        const map = {};
        allParams.forEach(p => { map[p.kode] = p; });
        return map;
    }, [allParams]);

    const handleValueChange = (paramId, type, val) => {
        setData(prevData => {
            const nextValues = {
                ...prevData.values,
                [paramId]: {
                    ...(prevData.values[paramId] || {}),
                    [type]: val,
                },
            };

            // Auto-calculation logic
            const param = paramMapById[paramId];
            if (param) {
                // 1. Selisih Tinggi Air = Sebelum - Dibaca
                // 2. Penguapan Open Pan = Selisih + CH Diukur
                if (['tinggi_air_sebelum', 'tinggi_air_dibaca', 'ch_diukur_openpan'].includes(param.kode)) {
                    const sebelumId = paramMapByCode['tinggi_air_sebelum']?.id;
                    const dibacaId = paramMapByCode['tinggi_air_dibaca']?.id;
                    const selisihId = paramMapByCode['selisih_tinggi_air']?.id;
                    const chId = paramMapByCode['ch_diukur_openpan']?.id;
                    const penguapanId = paramMapByCode['penguapan_openpan']?.id;

                    const seb = parseFloat(nextValues[sebelumId]?.manual ?? 0);
                    const dib = parseFloat(nextValues[dibacaId]?.manual ?? 0);
                    const ch = parseFloat(nextValues[chId]?.manual ?? 0);

                    if (selisihId && !isNaN(seb) && !isNaN(dib) && nextValues[dibacaId]?.manual !== '') {
                        const selisih = (seb - dib).toFixed(1);
                        nextValues[selisihId] = { ...(nextValues[selisihId] || {}), manual: selisih };

                        if (penguapanId) {
                            const peng = (parseFloat(selisih) + (isNaN(ch) ? 0 : ch)).toFixed(1);
                            nextValues[penguapanId] = { ...(nextValues[penguapanId] || {}), manual: peng };
                        }
                    }
                }

                // 3. Penguapan Piche = Sekarang - Sebelum
                if (['piche_sebelum', 'piche_sekarang'].includes(param.kode)) {
                    const pSebId = paramMapByCode['piche_sebelum']?.id;
                    const pSekId = paramMapByCode['piche_sekarang']?.id;
                    const pPengId = paramMapByCode['penguapan_piche']?.id;

                    const pSeb = parseFloat(nextValues[pSebId]?.manual ?? 0);
                    const pSek = parseFloat(nextValues[pSekId]?.manual ?? 0);

                    if (pPengId && !isNaN(pSeb) && !isNaN(pSek) && nextValues[pSekId]?.manual !== '') {
                        const pengPiche = (pSek - pSeb).toFixed(1);
                        nextValues[pPengId] = { ...(nextValues[pPengId] || {}), manual: pengPiche };
                    }
                }
            }

            return { ...prevData, values: nextValues };
        });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('observations.store'));
    };

    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-slate-900 text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition font-medium";
    const readonlyClass = "w-full bg-slate-100 border border-slate-200 rounded-xl px-3 h-9 text-slate-700 text-xs font-semibold outline-none cursor-not-allowed";

    // Filtering cards
    // Kartu 1-7 hanya tampil jika slot AGM1B (07:30, 13:30, 17:30)
    // Kartu 8 tampil sesuai jadwal_baca tiap parameter
    const kartu1To7 = [1, 2, 3, 4, 5, 6, 7];
    const kartu8Params = allParams.filter(p => {
        if (p.kartu !== 8) return false;
        if (!p.jadwal_baca) return true;
        if (p.jadwal_baca.includes('HARIAN_0700')) return jamWibStr === '07:00';
        if (p.jadwal_baca.includes('JAM_PENUH')) return !isAgm1bSlot;
        return true;
    });

    return (
        <Sidebar>
            <Head title="Input Observasi - SILAP-Kinerja" />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Link
                            href={route('observations.index')}
                            className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-800 space-x-1 mb-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Kembali ke Riwayat</span>
                        </Link>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Form Observasi Cuaca (Form Nasional FDIH)</h1>
                        <p className="text-slate-500 text-xs mt-0.5">
                            Pencatatan 19 slot per hari (16 jam penuh 07:00–22:00 &amp; 3 slot AGM1B 07:30, 13:30, 17:30 WIB).
                        </p>
                    </div>
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex items-start space-x-3 text-rose-900 text-xs font-semibold shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-bold text-rose-900 text-sm">Kesalahan Validasi Data Observasi:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-rose-800">
                                {Object.entries(errors).map(([key, msg]) => (
                                    <li key={key}>{msg}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-8">
                    {/* Header Bagian 1: Slot & Tanggal */}
                    <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm space-y-6">
                        <h2 className="font-bold text-base text-slate-900 border-b border-sky-100 pb-3 flex items-center justify-between">
                            <span>Informasi Pengamatan &amp; Slot</span>
                            {isMandatoryPhoto ? (
                                <span className="text-xs bg-amber-50 text-amber-800 border border-amber-300 font-bold px-3 py-1 rounded-full flex items-center space-x-1.5">
                                    <Camera className="w-3.5 h-3.5" />
                                    <span>Wajib Foto (Slot {jamWibStr} WIB)</span>
                                </span>
                            ) : (
                                <span className="text-xs bg-slate-50 text-slate-600 border border-slate-200 font-medium px-3 py-1 rounded-full">
                                    Tanpa Field Foto (Bukan 07.00 / 17.00)
                                </span>
                            )}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Pengamatan</label>
                                <input
                                    type="date"
                                    value={data.tanggal}
                                    onChange={(e) => setData('tanggal', e.target.value)}
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Slot Jadwal Pengamatan</label>
                                <select
                                    value={data.schedule_id}
                                    onChange={(e) => setData('schedule_id', e.target.value)}
                                    className={inputClass}
                                    required
                                >
                                    {schedules.map((s) => {
                                        const jw = s.jam_wib.substring(0, 5);
                                        const isAgm = ['07:30', '13:30', '17:30'].includes(jw);
                                        const isPhoto = ['07:00', '17:00'].includes(jw);
                                        return (
                                            <option key={s.id} value={s.id}>
                                                Pukul {jw} WIB {isAgm ? '[AGM 1-B]' : '[Jam Penuh]'} {isPhoto ? '📷 Wajib Foto' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    {isAgm1bSlot ? '⭐ Slot AGM 1-B: Menampilkan Kartu 1 s.d. 7 (Tab FDIH).' : '⭐ Slot Jam Penuh: Menampilkan Kartu 8.'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status Observasi</label>
                                <select
                                    value={data.status_pengamatan}
                                    onChange={(e) => setData('status_pengamatan', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="lengkap">Lengkap / Normal</option>
                                    <option value="dibatalkan">Dibatalkan (Hambatan Khusus)</option>
                                </select>
                            </div>
                        </div>

                        {data.status_pengamatan === 'dibatalkan' && (
                            <div>
                                <label className="block text-xs font-semibold text-rose-700 mb-1">Alasan Pembatalan</label>
                                <textarea
                                    value={data.alasan_batal}
                                    onChange={(e) => setData('alasan_batal', e.target.value)}
                                    className="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-3 text-slate-900 text-xs placeholder:text-xs outline-none focus:bg-white focus:border-rose-500 transition font-medium"
                                    placeholder="Jelaskan alasan pengamatan dibatalkan..."
                                    rows="2"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {data.status_pengamatan === 'lengkap' && (
                        <>
                            {/* KARTU 1-7 HANYA MUNCUL DI SLOT AGM1B */}
                            {isAgm1bSlot && (
                                <div className="space-y-6">
                                    <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center space-x-3 text-sky-900 text-xs">
                                        <Info className="w-5 h-5 text-sky-600 shrink-0" />
                                        <div>
                                            <p className="font-bold">Formulir Laporan Agm 1-b (Tab FDIH Nasional)</p>
                                            <p className="text-sky-800">
                                                Jadwal 3 kali sehari: 07.30, 13.30, 17.30 WIB. Kartu 1–7 tersusun sesuai tampilan resmi BMKGSoft v2.
                                            </p>
                                        </div>
                                    </div>

                                    {kartu1To7.map(kNum => {
                                        const cardParams = allParams.filter(p => p.kartu === kNum);
                                        if (cardParams.length === 0) return null;

                                        const cardTitles = {
                                            1: 'Kartu 1. Psikrometer Sangkar (1,2 m)',
                                            2: 'Kartu 2. Angin (0,5 m & 10 m)',
                                            3: 'Kartu 3. Open Pan Evaporimeter (OP Penguapan)',
                                            4: 'Kartu 4. Psikrometer Assman (Bertingkat)',
                                            5: 'Kartu 5. Piche Evaporimeter',
                                            6: 'Kartu 6. Pengamatan Kualitatif',
                                            7: 'Kartu 7. Suhu Tanah (Gundul & Berumput)',
                                        };

                                        return (
                                            <div key={kNum} className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm space-y-4">
                                                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
                                                    <span>{cardTitles[kNum]}</span>
                                                    <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                                        AGM 1-B
                                                    </span>
                                                </h3>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                    {cardParams.map(param => {
                                                        const isSebelum = param.sifat === 'sebelum';
                                                        const isDihitungApp = param.sifat === 'dihitung_app';
                                                        const isDihitungNasional = param.sifat === 'dihitung_nasional';
                                                        const isInactive = !param.is_active;

                                                        return (
                                                            <div key={param.id} className="space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <label className="text-xs font-semibold text-slate-800 flex items-center space-x-1">
                                                                        <span>{param.label}</span>
                                                                        {isInactive && (
                                                                            <span className="text-[9px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                                                                                (9999)
                                                                            </span>
                                                                        )}
                                                                    </label>
                                                                    {param.satuan && (
                                                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                                            {param.satuan}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {isInactive ? (
                                                                    <input
                                                                        type="text"
                                                                        disabled
                                                                        value="9999 (Nonaktif)"
                                                                        className={readonlyClass}
                                                                    />
                                                                ) : isDihitungNasional ? (
                                                                    <input
                                                                        type="text"
                                                                        disabled
                                                                        value="otomatis"
                                                                        className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 h-9 text-emerald-800 text-xs font-semibold italic cursor-not-allowed"
                                                                    />
                                                                ) : isDihitungApp ? (
                                                                    <input
                                                                        type="text"
                                                                        readOnly
                                                                        value={data.values[param.id]?.manual || ''}
                                                                        placeholder="Dihitung otomatis..."
                                                                        className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 h-9 text-sky-900 text-xs font-bold outline-none"
                                                                    />
                                                                ) : isSebelum ? (
                                                                    <div className="flex items-center space-x-2">
                                                                        <input
                                                                            type="number"
                                                                            step="any"
                                                                            readOnly={!editableSebelum[param.id]}
                                                                            value={data.values[param.id]?.manual || ''}
                                                                            onChange={e => handleValueChange(param.id, 'manual', e.target.value)}
                                                                            className={editableSebelum[param.id] ? inputClass : "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 text-slate-800 text-xs font-semibold"}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleEditSebelum(param.id)}
                                                                            title="Ubah nilai sebelum bila ada reset/isi ulang"
                                                                            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition shrink-0 flex items-center space-x-1"
                                                                        >
                                                                            <Edit3 className="w-3 h-3" />
                                                                            <span>{editableSebelum[param.id] ? 'Kunci' : 'Ubah'}</span>
                                                                        </button>
                                                                    </div>
                                                                ) : param.tipe_input === 'select' ? (
                                                                    <select
                                                                        className={inputClass}
                                                                        value={data.values[param.id]?.manual || ''}
                                                                        onChange={e => handleValueChange(param.id, 'manual', e.target.value)}
                                                                    >
                                                                        <option value="">-- Pilih {param.label} --</option>
                                                                        {(parameterOptions[param.kode] || []).map(opt => (
                                                                            <option key={opt.id} value={opt.nilai}>{opt.label}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : param.tipe_input === 'text' ? (
                                                                    <input
                                                                        type="text"
                                                                        className={inputClass}
                                                                        value={data.values[param.id]?.manual || ''}
                                                                        onChange={e => handleValueChange(param.id, 'manual', e.target.value)}
                                                                        placeholder="Keterangan opsional..."
                                                                    />
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        <input
                                                                            type="number"
                                                                            step="any"
                                                                            className={inputClass}
                                                                            value={data.values[param.id]?.manual || ''}
                                                                            onChange={e => handleValueChange(param.id, 'manual', e.target.value)}
                                                                            placeholder="Nilai manual"
                                                                        />
                                                                        {param.kode_aws && (
                                                                            <input
                                                                                type="number"
                                                                                step="any"
                                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-7 text-slate-700 text-[11px] outline-none placeholder:text-slate-400"
                                                                                value={data.values[param.id]?.aws || ''}
                                                                                onChange={e => handleValueChange(param.id, 'aws', e.target.value)}
                                                                                placeholder={`Nilai AWS (${param.kode_aws})`}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* KARTU 8: ALAT DI LUAR TAB FDIH (JAM PENUH & HARIAN 07.00) */}
                            {kartu8Params.length > 0 && (
                                <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm space-y-4">
                                    <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
                                        <span>Kartu 8. Pengamatan Jam Penuh &amp; Alat Harian</span>
                                        <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                            {jamWibStr === '07:00' ? 'JAM_PENUH + HARIAN_0700' : 'JAM_PENUH'}
                                        </span>
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {kartu8Params.map(param => {
                                            const isInactive = !param.is_active;

                                            return (
                                                <div key={param.id} className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-semibold text-slate-800 flex items-center space-x-1">
                                                            <span>{param.label}</span>
                                                            {isInactive && (
                                                                <span className="text-[9px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                                                                    (nonaktif 9999)
                                                                </span>
                                                            )}
                                                        </label>
                                                        {param.satuan && (
                                                            <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                                {param.satuan}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {isInactive ? (
                                                        <input
                                                            type="text"
                                                            disabled
                                                            value="9999 (Nonaktif)"
                                                            className={readonlyClass}
                                                        />
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <input
                                                                type="number"
                                                                step={param.tipe_input === 'integer' ? '1' : 'any'}
                                                                min={param.batas_min ?? undefined}
                                                                max={param.batas_max ?? undefined}
                                                                className={inputClass}
                                                                value={data.values[param.id]?.manual || ''}
                                                                onChange={e => handleValueChange(param.id, 'manual', e.target.value)}
                                                                placeholder={`Nilai Manual ${param.satuan ? '(' + param.satuan + ')' : ''}`}
                                                            />
                                                            {param.kode_aws && (
                                                                <input
                                                                    type="number"
                                                                    step="any"
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-7 text-slate-700 text-[11px] outline-none placeholder:text-slate-400"
                                                                    value={data.values[param.id]?.aws || ''}
                                                                    onChange={e => handleValueChange(param.id, 'aws', e.target.value)}
                                                                    placeholder={`Nilai AWS (${param.kode_aws})`}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Part Foto Bukti Live: HANYA MUNCUL DI SLOT 07:00 & 17:00 */}
                    {isMandatoryPhoto && (
                        <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm space-y-4">
                            <h2 className="font-bold text-base text-slate-900 border-b border-sky-100 pb-3 flex items-center justify-between">
                                <span>Foto Bukti Kegiatan (Kamera Langsung)</span>
                                <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 font-bold">
                                    Slot Wajib Foto ({jamWibStr} WIB)
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500">
                                Sesuai ketentuan, foto bukti pengamatan wajib diambil langsung (tanpa galeri) pada slot 07.00 WIB (shift pagi) dan 17.00 WIB (shift siang).
                            </p>

                            <WatermarkCamera
                                onCapture={(base64Image) => setData('foto', base64Image)}
                                isRequired={data.status_pengamatan === 'lengkap'}
                            />
                            {errors.foto && <p className="text-xs text-rose-600 font-medium">{errors.foto}</p>}
                        </div>
                    )}

                    {/* Footer Actions: Kunci submit jika foto wajib belum diambil */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <Link
                            href={route('observations.index')}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold transition"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Batal &amp; Kembali</span>
                        </Link>

                        <button
                            type="submit"
                            disabled={processing || (isMandatoryPhoto && data.status_pengamatan === 'lengkap' && !data.foto)}
                            className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm text-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <Send className="w-4 h-4" />
                            <span>{processing ? 'Menyimpan...' : 'Simpan Observasi'}</span>
                        </button>
                    </div>
                </form>
            </main>
        </Sidebar>
    );
}
