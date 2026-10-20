import React, { useEffect, useRef } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import WatermarkCamera from '../../Components/WatermarkCamera';
import ObservationFields, { useObservationFields } from '../../Components/ObservationFields';
import { ArrowLeft, Send, AlertCircle, AlertTriangle, Camera } from 'lucide-react';

export default function EditObservation({ observation, existingValues = {}, schedules = [], instruments = [], parameterOptions = {}, settings = {}, aturanFisika = {} }) {
    const cleanDate = typeof observation.tanggal === 'string' 
        ? observation.tanggal.split('T')[0] 
        : observation.tanggal;

    const initialValues = {};
    instruments.forEach(inst => {
        inst.parameters?.forEach(p => {
            const current = existingValues[p.id];
            initialValues[p.id] = {
                manual: current?.manual ?? '',
                aws: current?.aws ?? '',
            };
        });
    });

    const { data, setData, put, processing, errors } = useForm({
        schedule_id: observation.schedule_id,
        tanggal: cleanDate,
        catatan_kondisi: observation.alasan_batal || '',
        values: initialValues,
        foto: null,
        foto_sumber: null,
    });

    // Form panjang: setelah simpan gagal, bawa pengguna ke banner kesalahan agar alasannya terlihat.
    const bannerGalatRef = useRef(null);
    const kunciGalat = JSON.stringify(errors);
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            bannerGalatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [kunciGalat]);


    const selectedSchedule = schedules.find(s => String(s.id) === String(data.schedule_id));
    const jamWibStr = selectedSchedule ? selectedSchedule.jam_wib.substring(0, 5) : '07:00';
    const isMandatoryPhoto = (settings.foto_slots || ['07:00', '17:00']).includes(jamWibStr);

    const { visibleParams, handleValueChange, issues } = useObservationFields({
        instruments, data, setData, jamWibStr, aturanFisika,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('observations.update', observation.id));
    };

    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-slate-900 text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition font-medium";

    return (
        <Sidebar>
            <Head title={`Revisi Observasi #${observation.id} - SILAP-Kinerja`} />

            <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Link
                            href={route('observations.index')}
                            className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-800 space-x-1 mb-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Kembali ke Riwayat</span>
                        </Link>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Form Perbaikan / Revisi Observasi Cuaca</h1>
                        <p className="text-slate-500 text-xs mt-0.5">
                            Perbaiki nilai parameter sesuai catatan penyelia, lalu simpan untuk diajukan validasi ulang.
                        </p>
                    </div>
                </div>

                {observation.status_approval === 'revision' && observation.catatan_supervisor && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 mb-6 flex items-start space-x-3 text-rose-900 shadow-sm">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-bold text-rose-900 text-sm">Catatan Revisi dari Penyelia BMKG:</p>
                            <p className="text-xs text-rose-800 leading-relaxed font-medium">
                                "{observation.catatan_supervisor}"
                            </p>
                        </div>
                    </div>
                )}

                {Object.keys(errors).length > 0 && (
                    <div ref={bannerGalatRef} role="alert" className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex items-start space-x-3 text-rose-900 text-xs font-semibold shadow-sm">
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

                <form onSubmit={submit} className="space-y-6 sm:space-y-8">
                    <div className="bg-white border border-sky-100 rounded-2xl p-3.5 sm:p-6 shadow-sm space-y-5 sm:space-y-6">
                        <h2 className="font-bold text-base text-slate-900 border-b border-sky-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                            <span>Informasi Pengamatan &amp; Slot</span>
                            {isMandatoryPhoto ? (
                                <span className="text-xs bg-amber-50 text-amber-800 border border-amber-300 font-bold px-3 py-1 rounded-full flex items-center space-x-1.5">
                                    <Camera className="w-3.5 h-3.5" />
                                    <span>Wajib Foto ({jamWibStr} WIB)</span>
                                </span>
                            ) : (
                                <span className="text-xs bg-slate-50 text-slate-600 border border-slate-200 font-medium px-3 py-1 rounded-full">
                                    Tanpa Field Foto (Bukan 07.00 / 17.00)
                                </span>
                            )}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Pengamatan</label>
                                <input
                                    type="date"
                                    value={data.tanggal}
                                    max={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })}
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
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Kondisi khusus <span className="font-normal text-slate-400">(opsional)</span>
                            </label>
                            <input
                                type="text"
                                value={data.catatan_kondisi}
                                onChange={(e) => setData('catatan_kondisi', e.target.value)}
                                maxLength={300}
                                className={inputClass}
                                placeholder="Contoh: hujan lebat dan petir, nilai dibaca dari AWS"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">
                                Isi bila tidak bisa ke taman alat. Catatan ini tampil untuk penyelia; foto pada slot 07.00 dan 17.00 tetap wajib.
                            </p>
                            {errors.catatan_kondisi && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.catatan_kondisi}</p>}
                        </div>
                    </div>

                    <ObservationFields
                        data={data}
                        visibleParams={visibleParams}
                        handleValueChange={handleValueChange}
                        issues={issues}
                        parameterOptions={parameterOptions}
                        jamWibStr={jamWibStr}
                        />

                    {isMandatoryPhoto && (
                        <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                            <h2 className="font-bold text-base text-slate-900 border-b border-sky-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                                <span>Foto Bukti Kegiatan (Kamera Langsung)</span>
                                <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 font-bold">
                                    Slot Wajib Foto ({jamWibStr} WIB)
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500">
                                Anda dapat memperbarui foto kegiatan observasi live di slot 07.00 atau 17.00 bila diperlukan. Bila tidak bisa ke taman alat, foto layar AWS atau foto Anda di depan monitor AWS.
                            </p>

                            <WatermarkCamera
                                onCapture={(base64Image, sumber) => setData(prev => ({ ...prev, foto: base64Image, foto_sumber: sumber }))}
                                geotag={settings.geotag}
                            />
                            {errors.foto && <p className="text-xs text-rose-600 font-medium">{errors.foto}</p>}
                        </div>
                    )}

                    {issues.pesan.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start space-x-3 text-rose-900 text-xs shadow-sm">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold text-sm">Periksa kembali nilai berikut sebelum menyimpan:</p>
                                <ul className="list-disc list-inside space-y-0.5 text-rose-800 font-medium">
                                    {issues.pesan.map((m, i) => <li key={i}>{m}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                        <Link
                            href={route('observations.index')}
                            className="w-full sm:w-auto inline-flex justify-center items-center space-x-1.5 px-5 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold transition"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Batal &amp; Kembali</span>
                        </Link>

                        <button
                            type="submit"
                            disabled={processing || issues.pesan.length > 0}
                            className="w-full sm:w-auto inline-flex justify-center items-center space-x-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-semibold px-6 py-3 sm:py-2.5 rounded-xl shadow-sm text-sm transition disabled:opacity-50 cursor-pointer"
                        >
                            <Send className="w-4 h-4" />
                            <span>{processing ? 'Menyimpan...' : 'Simpan Perbaikan & Ajukan Validasi'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </Sidebar>
    );
}
