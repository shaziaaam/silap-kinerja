import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import WatermarkCamera from '../../Components/WatermarkCamera';
import ObservationFields, { useObservationFields } from '../../Components/ObservationFields';
import { ArrowLeft, Send, AlertTriangle, Camera } from 'lucide-react';

export default function CreateObservation({ schedules = [], instruments = [], parameterOptions = {}, previousValues = {}, settings = {}, aturanFisika = {}, slotTerisi = [], hariIni = null }) {
    const getNearestScheduleId = (scheduleList) => {
        if (!scheduleList || scheduleList.length === 0) return '';

        const now = new Date();
        const wibStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false });
        const parts = wibStr.split(':');
        const currentHour = parseInt(parts[0], 10);
        const currentMinute = parseInt(parts[1], 10);

        // Nearest slot that nobody has filled yet today; all filled -> nearest overall.
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const terisi = new Set(slotTerisi.map(String));
        const kosong = scheduleList.filter(s => !terisi.has(String(s.id)));
        const kandidat = kosong.length > 0 ? kosong : scheduleList;
        let closest = kandidat[0];
        let minDiff = Infinity;

        kandidat.forEach(s => {
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
        tanggal: hariIni || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
        status_pengamatan: 'lengkap',
        alasan_batal: '',
        values: initialValues,
        foto: null,
        foto_sumber: null,
    });

    const selectedSchedule = schedules.find(s => String(s.id) === String(data.schedule_id));
    const jamWibStr = selectedSchedule ? selectedSchedule.jam_wib.substring(0, 5) : '07:00';
    const isAgm1bSlot = ['07:30', '13:30', '17:30'].includes(jamWibStr);
    const isMandatoryPhoto = (settings.foto_slots || ['07:00', '17:00']).includes(jamWibStr);

    const { visibleParams, handleValueChange, issues } = useObservationFields({
        instruments, data, setData, jamWibStr, aturanFisika,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('observations.store'));
    };

    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-slate-900 text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition font-medium";

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
                                    max={hariIni || undefined}
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
                                                Pukul {jw} WIB {isAgm ? '[AGM 1-B]' : '[Jam Penuh]'} {isPhoto ? '📷 Wajib Foto' : ''}{data.tanggal === hariIni && slotTerisi.map(String).includes(String(s.id)) ? ' ✓ sudah diisi' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    {isAgm1bSlot ? 'Slot AGM 1-B: field tab FDIH (kartu 1–7).' : 'Slot jam penuh: field di luar tab FDIH (kartu 8).'}
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
                        <ObservationFields
                            data={data}
                            visibleParams={visibleParams}
                            handleValueChange={handleValueChange}
                            issues={issues}
                            parameterOptions={parameterOptions}
                            jamWibStr={jamWibStr}
                        />
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
                            disabled={processing || issues.pesan.length > 0 || (isMandatoryPhoto && data.status_pengamatan === 'lengkap' && !data.foto)}
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
