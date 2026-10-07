import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import WatermarkCamera from '../../Components/WatermarkCamera';
import { ArrowLeft, Send, Thermometer, Gauge, Wind, Sun, Cloud, Eye, AlertTriangle } from 'lucide-react';

export default function CreateObservation({ schedules, instruments, settings }) {
    const getNearestScheduleId = (scheduleList) => {
        if (!scheduleList || scheduleList.length === 0) return '';

        const now = new Date();
        const wibStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false });
        const parts = wibStr.split(':');
        let currentHour = parseInt(parts[0], 10);
        const currentMinute = parseInt(parts[1], 10);

        if (currentMinute >= 30) {
            currentHour = (currentHour + 1) % 24;
        }

        if (currentHour < settings.jam_mulai) currentHour = settings.jam_mulai;
        if (currentHour > settings.jam_selesai) currentHour = settings.jam_selesai;

        const targetWibPrefix = String(currentHour).padStart(2, '0') + ':';
        const matched = scheduleList.find(s => s.jam_wib?.startsWith(targetWibPrefix));
        return matched ? matched.id : (scheduleList[0]?.id || '');
    };

    const { data, setData, post, processing, errors } = useForm({
        schedule_id: getNearestScheduleId(schedules),
        tanggal: new Date().toISOString().split('T')[0],
        status_pengamatan: 'lengkap',
        alasan_batal: '',
        values: {}, // Format: { [paramId]: { aws: '', manual: '' } }
        foto: null,
    });

    const selectedSchedule = schedules.find(s => String(s.id) === String(data.schedule_id));
    const isMandatoryPhoto = selectedSchedule?.is_synoptic || false;
    const currentWibHour = selectedSchedule ? parseInt(selectedSchedule.jam_wib.split(':')[0], 10) : settings.jam_mulai;

    const handleValueChange = (paramId, type, val) => {
        setData('values', {
            ...data.values,
            [paramId]: {
                ...(data.values[paramId] || {}),
                [type]: val,
            },
        });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('observations.store'));
    };

    const isParamScheduled = (param) => {
        if (!param.jadwal_baca || param.jadwal_baca.length === 0) return true;
        return param.jadwal_baca.includes(currentWibHour);
    };

    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-3.5 h-10 text-slate-900 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/50 transition font-medium";

    // Split instruments into 2 Cards
    const card1TamanAlat = instruments.filter(i => i.kategori === 'taman_alat');
    const card2AWS = instruments.filter(i => i.kategori === 'aws');

    return (
        <Sidebar>
            <Head title="Input Observasi - SILAP-Kinerja" />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Link
                            href={route('observations.index')}
                            className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-900 space-x-1 mb-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Kembali ke Riwayat</span>
                        </Link>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Form Input Observasi Cuaca</h1>
                        <p className="text-slate-500 text-xs mt-0.5">
                            Pencatatan jam operasional Staklim Jateng ({settings.jam_mulai.toString().padStart(2, '0')}:00 s.d. {settings.jam_selesai.toString().padStart(2, '0')}:00 WIB).
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
                    {/* Part 1: Tanggal & Jadwal Jam Pengamatan */}
                    <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-md space-y-6">
                        <h2 className="font-bold text-base text-slate-900 border-b border-emerald-100 pb-3 flex items-center justify-between">
                            <span>1. Tanggal &amp; Jadwal Jam Pengamatan</span>
                            {isMandatoryPhoto ? (
                                <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3 py-1 rounded-full">
                                    📷 Wajib Foto (Jam 07:00 &amp; 17:00 WIB)
                                </span>
                            ) : (
                                <span className="text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold px-3 py-1 rounded-full">
                                    📷 Foto Opsional
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
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jadwal Jam Pengamatan</label>
                                <select
                                    value={data.schedule_id}
                                    onChange={(e) => setData('schedule_id', e.target.value)}
                                    className={inputClass}
                                    required
                                >
                                    {schedules.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            Pukul {s.jam_wib.substring(0, 5)} WIB ({s.jam_utc.substring(0, 5)} UTC)
                                        </option>
                                    ))}
                                </select>
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
                            {/* Card 1: Taman Alat */}
                            <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-md space-y-6">
                                <div className="border-b border-emerald-100 pb-3 flex items-center justify-between">
                                    <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                                        <Thermometer className="w-5 h-5 text-emerald-600" />
                                        <span>2. Taman Alat</span>
                                    </h2>
                                    <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold border border-emerald-200">
                                        Rute Observer: Luar ke Dalam
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {card1TamanAlat.flatMap(instr => instr.parameters).filter(isParamScheduled).map(param => (
                                        <div
                                            key={param.id}
                                            className={`space-y-1.5 ${
                                                param.tipe_input === 'multicheck' ? 'col-span-1 md:col-span-2 lg:col-span-3' : 'col-span-1'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-800">{param.label}</label>
                                                {param.satuan && (
                                                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                        {param.satuan}
                                                    </span>
                                                )}
                                            </div>

                                            {param.tipe_input === 'select' ? (
                                                <select
                                                    className={inputClass}
                                                    value={data.values[param.id]?.manual || ''}
                                                    onChange={e => handleValueChange(param.id, 'manual', e.target.value)}
                                                >
                                                    <option value="">-- Pilih --</option>
                                                    {param.kode === 'keadaan_cuaca' && ['Cerah', 'Cerah Berawan', 'Berawan', 'Hujan Ringan', 'Hujan Deras', 'Badai Guntur'].map(o => <option key={o} value={o}>{o}</option>)}
                                                    {param.kode === 'jenis_awan' && ['Cumulus', 'Stratus', 'Cirrus', 'Altocumulus', 'Stratocumulus', 'Cumulonimbus'].map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            ) : param.tipe_input === 'multicheck' ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                                                    {['Kabut', 'Embun', 'Embun Upas', 'Halo', 'Petir/Kilat', 'Badai Guntur', 'Hujan Deras', 'Hujan Es', 'Pelangi', 'Puting Beliung', 'Udara Kabur (Haze)', 'Asap'].map(item => {
                                                        const currentList = Array.isArray(data.values[param.id]?.manual)
                                                            ? data.values[param.id].manual
                                                            : (data.values[param.id]?.manual ? JSON.parse(data.values[param.id]?.manual) : []);
                                                        const isChecked = currentList.includes(item);
                                                        return (
                                                            <label key={item} className={`flex items-center space-x-2 text-xs p-2 rounded-lg border cursor-pointer transition ${isChecked ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={e => {
                                                                        const updated = e.target.checked
                                                                            ? [...currentList, item]
                                                                            : currentList.filter(x => x !== item);
                                                                        handleValueChange(param.id, 'manual', updated);
                                                                    }}
                                                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                                />
                                                                <span>{item}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <input
                                                    type={param.tipe_input === 'integer' || param.tipe_input === 'number' ? 'number' : 'text'}
                                                    step={param.tipe_input === 'number' ? 'any' : '1'}
                                                    min={param.batas_min ?? undefined}
                                                    max={param.batas_max ?? undefined}
                                                    className={inputClass}
                                                    value={data.values[param.id]?.manual || ''}
                                                    onChange={e => handleValueChange(param.id, 'manual', e.target.value)}
                                                    placeholder={param.satuan ? `Nilai (${param.satuan})` : 'Masukkan nilai'}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Card 2: Data AWS (Monitor & Display YOUNG) */}
                            <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-md space-y-6">
                                <div className="border-b border-emerald-100 pb-3 flex items-center justify-between">
                                    <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                                        <Gauge className="w-5 h-5 text-emerald-600" />
                                        <span>3. Data AWS (Monitor &amp; Display YOUNG)</span>
                                    </h2>
                                    <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200">
                                        Pembacaan Monitor Stasiun
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {card2AWS.flatMap(instr => instr.parameters).filter(isParamScheduled).map(param => (
                                        <div key={param.id} className="space-y-1.5 col-span-1">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-800">{param.label}</label>
                                                {param.satuan && (
                                                    <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                        {param.satuan}
                                                    </span>
                                                )}
                                            </div>

                                            <input
                                                type="number"
                                                step="any"
                                                min={param.batas_min ?? undefined}
                                                max={param.batas_max ?? undefined}
                                                className={inputClass}
                                                value={data.values[param.id]?.aws || ''}
                                                onChange={e => handleValueChange(param.id, 'aws', e.target.value)}
                                                placeholder={param.satuan ? `Nilai AWS (${param.satuan})` : 'Masukkan nilai AWS'}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Part 4: Foto Bukti Live */}
                    <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-md space-y-4">
                        <h2 className="font-bold text-base text-slate-900 border-b border-emerald-100 pb-3 flex items-center justify-between">
                            <span>4. Foto Bukti Live Kamera</span>
                            {isMandatoryPhoto && (
                                <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold">
                                    Sinoptik (Wajib Foto)
                                </span>
                            )}
                        </h2>

                        <WatermarkCamera
                            onCapture={(base64Image) => setData('foto', base64Image)}
                            isRequired={isMandatoryPhoto && data.status_pengamatan === 'lengkap'}
                        />
                        {errors.foto && <p className="text-xs text-rose-600 font-medium">{errors.foto}</p>}
                    </div>

                    {/* Bottom Action Footer */}
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
                            disabled={processing}
                            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 text-sm transition disabled:opacity-50 cursor-pointer"
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
