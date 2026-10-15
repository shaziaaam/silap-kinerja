import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Sidebar from '../Components/Sidebar';
import {
    CloudSun, FilePlus, CheckSquare, FileText, Users, ArrowRight,
    ShieldCheck, Clock, Camera, Thermometer, Droplets, Gauge,
    AlertCircle, CheckCircle2, RefreshCw, ChevronRight, Eye, Wrench, Edit
} from 'lucide-react';

// Custom SVG 8-Direction Wind Rose
function WindRoseSVG({ windDirections }) {
    const directions = [
        { key: 'U', label: 'U', angle: 0 },
        { key: 'TL', label: 'TL', angle: 45 },
        { key: 'T', label: 'T', angle: 90 },
        { key: 'BD', label: 'SE', angle: 135 },
        { key: 'S', label: 'S', angle: 180 },
        { key: 'BD2', label: 'SW', angle: 225 },
        { key: 'B', label: 'B', angle: 270 },
        { key: 'BL', label: 'NW', angle: 315 },
    ];

    const maxFreq = Math.max(...Object.values(windDirections), 1);
    const center = 110;
    const maxRadius = 75;

    return (
        <svg viewBox="0 0 220 220" className="w-full max-w-[220px] mx-auto drop-shadow-sm">
            {/* Concentric circles */}
            {[0.25, 0.5, 0.75, 1].map((r, i) => (
                <circle
                    key={i}
                    cx={center}
                    cy={center}
                    r={maxRadius * r}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray={i < 3 ? "2 2" : "none"}
                />
            ))}

            {/* Axes lines */}
            {directions.map(d => {
                const rad = (d.angle - 90) * (Math.PI / 180);
                const x2 = center + maxRadius * Math.cos(rad);
                const y2 = center + maxRadius * Math.sin(rad);
                return (
                    <line key={d.key} x1={center} y1={center} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="1" />
                );
            })}

            {/* Petals */}
            {directions.map(d => {
                const count = windDirections[d.key] || 0;
                const len = (count / maxFreq) * maxRadius;
                if (len <= 0) return null;

                const rad = (d.angle - 90) * (Math.PI / 180);
                const x = center + len * Math.cos(rad);
                const y = center + len * Math.sin(rad);

                const radLeft = (d.angle - 90 - 15) * (Math.PI / 180);
                const radRight = (d.angle - 90 + 15) * (Math.PI / 180);
                const p1x = center + (len * 0.7) * Math.cos(radLeft);
                const p1y = center + (len * 0.7) * Math.sin(radLeft);
                const p2x = center + (len * 0.7) * Math.cos(radRight);
                const p2y = center + (len * 0.7) * Math.sin(radRight);

                return (
                    <g key={d.key}>
                        <polygon
                            points={`${center},${center} ${p1x},${p1y} ${x},${y} ${p2x},${p2y}`}
                            fill="#0284c7"
                            fillOpacity="0.75"
                            stroke="#1e40af"
                            strokeWidth="1.5"
                        />
                    </g>
                );
            })}

            {/* Direction Labels */}
            {directions.map(d => {
                const labelRadius = maxRadius + 15;
                const rad = (d.angle - 90) * (Math.PI / 180);
                const lx = center + labelRadius * Math.cos(rad);
                const ly = center + labelRadius * Math.sin(rad) + 4;
                return (
                    <text
                        key={d.key}
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        className="text-[10px] font-extrabold fill-slate-700"
                    >
                        {d.label}
                    </text>
                );
            })}
        </svg>
    );
}

// Custom SVG Soil Temperature Profile Chart
function SoilTempSVG({ gundul, rumput }) {
    const depths = [0, 5, 10, 20, 50, 100];
    const width = 300;
    const height = 180;
    const padding = { top: 20, right: 30, bottom: 30, left: 45 };

    const validVals = [...gundul, ...rumput].map(d => d.val).filter(v => v !== null && !isNaN(v));
    const minTemp = validVals.length > 0 ? Math.min(...validVals) - 2 : 20;
    const maxTemp = validVals.length > 0 ? Math.max(...validVals) + 2 : 40;

    const getX = (val) => {
        if (val === null || isNaN(val)) return padding.left;
        return padding.left + ((val - minTemp) / (maxTemp - minTemp)) * (width - padding.left - padding.right);
    };

    const getY = (depthIndex) => {
        return padding.top + (depthIndex / (depths.length - 1)) * (height - padding.top - padding.bottom);
    };

    const gundulPoints = gundul.map((d, i) => d.val !== null ? `${getX(d.val)},${getY(i)}` : null).filter(Boolean).join(' ');
    const rumputPoints = rumput.map((d, i) => d.val !== null ? `${getX(d.val)},${getY(i)}` : null).filter(Boolean).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {/* Horizontal Grid lines per depth */}
            {depths.map((d, i) => (
                <g key={d}>
                    <line x1={padding.left} y1={getY(i)} x2={width - padding.right} y2={getY(i)} stroke="#e2e8f0" strokeDasharray="2 2" />
                    <text x={padding.left - 6} y={getY(i) + 4} textAnchor="end" className="text-[9px] font-bold fill-slate-500">
                        {d} cm
                    </text>
                </g>
            ))}

            {/* Polyline Gundul (Orange) */}
            {gundulPoints && (
                <polyline points={gundulPoints} fill="none" stroke="#f97316" strokeWidth="2.5" />
            )}
            {gundul.map((d, i) => d.val !== null && (
                <circle key={`g-${i}`} cx={getX(d.val)} cy={getY(i)} r="4" fill="#f97316" />
            ))}

            {/* Polyline Rumput (Blue) */}
            {rumputPoints && (
                <polyline points={rumputPoints} fill="none" stroke="#0284c7" strokeWidth="2.5" />
            )}
            {rumput.map((d, i) => d.val !== null && (
                <circle key={`r-${i}`} cx={getX(d.val)} cy={getY(i)} r="4" fill="#0284c7" />
            ))}
        </svg>
    );
}

// Custom SVG Rain Hourly Bar + Cumulative Line Chart
function RainChartSVG({ rainData }) {
    const width = 560;
    const height = 180;
    const padding = { top: 20, right: 30, bottom: 30, left: 40 };

    const maxVal = Math.max(...rainData.map(d => Math.max(d.rain, d.cumulative || 0)), 10);
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const getX = (index) => padding.left + (index / (rainData.length - 1 || 1)) * chartW;
    const getY = (val) => height - padding.bottom - (val / maxVal) * chartH;

    const cumulativePoints = rainData
        .filter(d => d.isAccumulated && d.cumulative !== null)
        .map(d => {
            const idx = rainData.findIndex(x => x.hour === d.hour);
            return `${getX(idx)},${getY(d.cumulative)}`;
        }).join(' ');

    const lastCum = rainData.filter(d => d.isAccumulated && d.cumulative !== null).pop();
    const lastCumIdx = lastCum ? rainData.findIndex(x => x.hour === lastCum.hour) : -1;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {/* Grid Y lines */}
            {[0, maxVal * 0.5, maxVal].map((val, i) => (
                <g key={i}>
                    <line x1={padding.left} y1={getY(val)} x2={width - padding.right} y2={getY(val)} stroke="#f1f5f9" strokeWidth="1" />
                    <text x={padding.left - 6} y={getY(val) + 4} textAnchor="end" className="text-[9px] font-bold fill-slate-400">
                        {Math.round(val)} mm
                    </text>
                </g>
            ))}

            {/* Bars */}
            {rainData.map((d, i) => {
                const x = getX(i);
                const barW = Math.max(10, chartW / rainData.length - 6);
                const barH = (d.rain / maxVal) * chartH;
                const y = height - padding.bottom - barH;

                return (
                    <g key={d.hour}>
                        <rect
                            x={x - barW / 2}
                            y={y}
                            width={barW}
                            height={barH}
                            fill={d.isAccumulated ? "#38bdf8" : "#cbd5e1"}
                            rx="3"
                        />
                        <text x={x} y={height - 10} textAnchor="middle" className="text-[9px] font-bold fill-slate-500">
                            {d.label.substring(0, 2)}
                        </text>
                    </g>
                );
            })}

            {/* Cumulative Line (Orange) */}
            {cumulativePoints && (
                <polyline points={cumulativePoints} fill="none" stroke="#f97316" strokeWidth="2.5" strokeDasharray="none" />
            )}

            {/* Marked end point on cumulative line */}
            {lastCumIdx >= 0 && (
                <g>
                    <circle cx={getX(lastCumIdx)} cy={getY(lastCum.cumulative)} r="5" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
                    <text x={getX(lastCumIdx)} y={getY(lastCum.cumulative) - 8} textAnchor="middle" className="text-[10px] font-extrabold fill-amber-700">
                        {lastCum.cumulative.toFixed(1)} mm
                    </text>
                </g>
            )}
        </svg>
    );
}

export default function Dashboard(props) {
    const {
        user, settings, today, currentWibHour, nextSchedule, schedules,
        todayObservations, rainHourlyData, totalRainToday, latestRainHour,
        latestSuhuAws, latestSuhuHour, latestQff, latestQffHour,
        soilTempGundul, soilTempRumput, windDirections,
        pendingCount, approvedTodayCount, revisionCount, observerQueue, heatmapData,
        totalInstruments, activeInstruments, roleBreakdown,
        instrumentStatusGrid
    } = props;

    const [selectedSlotModal, setSelectedSlotModal] = useState(null);

    const isPhotoSlot = (h) => [7, 17].includes(h);

    return (
        <Sidebar>
            <Head title="Dashboard - SILAP-Kinerja" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

                {/* HEADER / WELCOME BANNER */}
                <div className="relative rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-sky-700 via-blue-700 to-sky-800 text-white shadow-sm overflow-hidden border border-sky-600/20">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-sky-100 border border-white/20 mb-2">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>BMKG Stasiun Klimatologi Jawa Tengah</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                                Halo, {user.nama}!
                            </h1>
                            <p className="text-xs text-sky-100 font-medium mt-0.5">
                                {today} · Slot berikutnya jam <strong className="text-white font-bold">{nextSchedule ? nextSchedule.jam_wib.substring(0, 5) : '07:00'} WIB</strong>
                            </p>
                        </div>

                        {user.role === 'pengamat' && (
                            <Link
                                href={route('observations.create')}
                                className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-sky-50 text-sky-900 font-bold text-sm transition shadow-sm shrink-0"
                            >
                                <FilePlus className="w-5 h-5 text-sky-600" />
                                <span>Input Observasi Pukul {nextSchedule ? nextSchedule.jam_wib.substring(0, 5) : '07:00'} WIB</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* ROLE A: PENGAMAT DASHBOARD */}
                {user.role === 'pengamat' && (
                    <div className="space-y-8">
                        {/* 16-SLOT TIMELINE */}
                        <div className="bg-white rounded-2xl border border-sky-100/80 p-6 shadow-sm shadow-sky-100/30 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                                    <Clock className="w-5 h-5 text-sky-600" />
                                    <span>Garis Waktu 16 Slot Pengamatan (07.00 - 22.00 WIB)</span>
                                </h2>
                                <span className="text-xs text-slate-500 font-medium">
                                    📷 Slot Foto Wajib: 07.00 & 17.00 WIB
                                </span>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-2">
                                {schedules.map((s) => {
                                    const h = parseInt(s.jam_wib.substring(0, 2), 10);
                                    const obs = todayObservations.find(o => o.schedule_id === s.id);
                                    const isCurrent = h === currentWibHour;
                                    const isPhoto = isPhotoSlot(h);

                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => {
                                                if (obs) setSelectedSlotModal(obs);
                                                else window.location.href = route('observations.create');
                                            }}
                                            className={`relative rounded-xl p-2.5 text-center cursor-pointer transition flex flex-col items-center justify-between min-h-[72px] border ${
                                                obs
                                                    ? 'bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100/80'
                                                    : isCurrent
                                                    ? 'bg-white border-2 border-sky-600 text-slate-900 shadow-sm ring-2 ring-sky-100'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span className="font-bold text-xs">{s.jam_wib.substring(0, 5)}</span>
                                            {isPhoto && (
                                                <Camera className={`w-3.5 h-3.5 my-1 ${obs ? 'text-sky-700' : 'text-slate-400'}`} title="Slot Foto Wajib (07.00 & 17.00)" />
                                            )}
                                            <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border ${
                                                obs ? 'bg-sky-600 text-white border-sky-600' : isCurrent ? 'bg-sky-100 text-sky-800 border-sky-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                                {obs ? 'Terisi' : isCurrent ? 'Jam Ini' : 'Belum'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* THREE NUMBER CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl border border-sky-100/80 p-6 shadow-sm shadow-sky-100/30 space-y-2">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Hujan Hari Ini (Akumulasi)</span>
                                    <Droplets className="w-4 h-4 text-sky-600" />
                                </div>
                                <div className="text-3xl font-extrabold text-sky-800">
                                    {totalRainToday.toFixed(1)} <span className="text-base font-bold text-slate-500">mm</span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    Penjumlahan slot 08.00 s/d slot {latestRainHour ? sprintf('%02d.00', latestRainHour) : 'terakhir'} (tidak mencakup 22.00-07.00)
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl border border-sky-100/80 p-6 shadow-sm shadow-sky-100/30 space-y-2">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Suhu Udara AWS (Input Terakhir)</span>
                                    <Thermometer className="w-4 h-4 text-sky-600" />
                                </div>
                                <div className="text-3xl font-extrabold text-slate-900">
                                    {latestSuhuAws !== null ? latestSuhuAws.toFixed(1) : '–'} <span className="text-base font-bold text-slate-500">°C</span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    {latestSuhuHour ? `Diinput pada slot pukul ${sprintf('%02d:00', latestSuhuHour)} WIB` : 'Belum ada input hari ini'}
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl border border-sky-100/80 p-6 shadow-sm shadow-sky-100/30 space-y-2">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Tekanan Udara QFF</span>
                                    <Gauge className="w-4 h-4 text-sky-600" />
                                </div>
                                <div className="text-3xl font-extrabold text-slate-900">
                                    {latestQff !== null ? latestQff.toFixed(1) : '–'} <span className="text-base font-bold text-slate-500">mbar</span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    {latestQffHour ? `Diinput pada slot pukul ${sprintf('%02d:00', latestQffHour)} WIB` : 'Belum ada input hari ini'}
                                </p>
                            </div>
                        </div>

                        {/* THREE CHARTS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Chart 1: Rain Bar + Accumulation Line */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-sky-100/80 p-6 shadow-sm shadow-sky-100/30 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                                        <Droplets className="w-4 h-4 text-sky-600" />
                                        <span>Curah Hujan 1 Jam Terakhir &amp; Akumulasi Harian</span>
                                    </h3>
                                    <div className="flex items-center space-x-3 text-xs font-semibold">
                                        <span className="flex items-center space-x-1">
                                            <span className="w-3 h-3 rounded bg-sky-400 inline-block"></span>
                                            <span>Curah Hujan (mm)</span>
                                        </span>
                                        <span className="flex items-center space-x-1">
                                            <span className="w-3 h-1 bg-amber-500 inline-block"></span>
                                            <span>Akumulasi (mm)</span>
                                        </span>
                                    </div>
                                </div>
                                <RainChartSVG rainData={rainHourlyData} />
                                <p className="text-[11px] text-slate-400 font-medium">
                                    * Batang slot 07.00 (hujan 06.00-07.00) tidak masuk penjumlahan akumulasi harian (milik hari klimatologi sebelumnya).
                                </p>
                            </div>

                            {/* Chart 2: Wind Rose SVG */}
                            <div className="bg-white rounded-2xl border border-sky-100/80 p-6 shadow-sm shadow-sky-100/30 space-y-4 flex flex-col justify-between">
                                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                                    <CloudSun className="w-4 h-4 text-sky-600" />
                                    <span>Wind Rose Frekuensi Arah Angin</span>
                                </h3>
                                <WindRoseSVG windDirections={windDirections} />
                                <p className="text-[11px] text-slate-400 text-center font-medium">
                                    Mewakili distribusi frekuensi arah angin 8 mata angin hari ini.
                                </p>
                            </div>
                        </div>

                        {/* Chart 3: Soil Temperature Profile */}
                        <div className="bg-white rounded-2xl border border-sky-100/80 p-6 shadow-sm shadow-sky-100/30 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                                    <Thermometer className="w-4 h-4 text-sky-600" />
                                    <span>Profil Kedalaman Suhu Tanah (°C)</span>
                                </h3>
                                <div className="flex items-center space-x-4 text-xs font-semibold">
                                    <span className="flex items-center space-x-1.5">
                                        <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                                        <span>Tanah Gundul</span>
                                    </span>
                                    <span className="flex items-center space-x-1.5">
                                        <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                                        <span>Tanah Berumput</span>
                                    </span>
                                </div>
                            </div>
                            <SoilTempSVG gundul={soilTempGundul} rumput={soilTempRumput} />
                        </div>
                    </div>
                )}

                {/* ROLE B: PENYELIA DASHBOARD */}
                {user.role === 'penyelia' && (
                    <div className="space-y-8">
                        {/* THREE NUMBER CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-sm shadow-amber-100/20 space-y-2">
                                <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Menunggu Validasi</div>
                                <div className="text-3xl font-extrabold text-amber-800">{pendingCount} <span className="text-sm font-bold text-amber-700">Observasi</span></div>
                                <p className="text-[11px] text-amber-700 font-medium">Antrean observasi yang belum ditinjau</p>
                            </div>

                            <div className="bg-white rounded-2xl border border-emerald-200/80 p-6 shadow-sm shadow-emerald-100/20 space-y-2">
                                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Disetujui Hari Ini</div>
                                <div className="text-3xl font-extrabold text-emerald-800">{approvedTodayCount} <span className="text-sm font-bold text-emerald-700">Observasi</span></div>
                                <p className="text-[11px] text-emerald-700 font-medium">Data observasi approved hari berjalan</p>
                            </div>

                            <div className="bg-white rounded-2xl border border-rose-200/80 p-6 shadow-sm shadow-rose-100/20 space-y-2">
                                <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Perlu Revisi</div>
                                <div className="text-3xl font-extrabold text-rose-800">{revisionCount} <span className="text-sm font-bold text-rose-700">Observasi</span></div>
                                <p className="text-[11px] text-rose-700 font-medium">Dikembalikan ke pengamat untuk perbaikan</p>
                            </div>
                        </div>

                        {/* OBSERVER QUEUE (Bordered Rows) */}
                        <div className="bg-white rounded-2xl border border-sky-100/80 p-6 shadow-sm shadow-sky-100/30 space-y-4">
                            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                                <Users className="w-5 h-5 text-sky-600" />
                                <span>Antrean Input Per Pengamat</span>
                            </h3>

                            <div className="divide-y divide-slate-100 border border-sky-100 rounded-xl overflow-hidden">
                                {observerQueue.map(obs => (
                                    <div
                                        key={obs.id}
                                        onClick={() => window.location.href = route('supervisor.queue') + `?user_id=${obs.id}`}
                                        className="flex items-center justify-between p-4 hover:bg-sky-50/50 cursor-pointer transition"
                                    >
                                        <div className="flex items-center space-x-3 min-w-0">
                                            <div className="font-bold text-sm text-slate-800">{obs.nama}</div>
                                            <span className="text-xs text-slate-400 font-mono">({obs.nip})</span>
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-sky-600 h-full rounded-full transition-all"
                                                    style={{ width: `${(obs.todaySlots / 16) * 100}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                                                obs.pendingCount > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                                            }`}>
                                                {obs.pendingCount > 0 ? `${obs.pendingCount} menunggu` : 'selesai'}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CALENDAR HEATMAP (Current Month Mon-Sun Grid) */}
                        <div className="bg-white rounded-2xl border border-sky-100/80 p-6 shadow-sm shadow-sky-100/30 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                                    <Clock className="w-5 h-5 text-sky-600" />
                                    <span>Peta Panas Kelengkapan Input Observasi Bulanan</span>
                                </h3>

                                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
                                    <span>Skala:</span>
                                    <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">&lt;70%</span>
                                    <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300">70-84%</span>
                                    <span className="px-2 py-0.5 rounded bg-sky-600 text-white">85-94%</span>
                                    <span className="px-2 py-0.5 rounded bg-blue-900 text-white">&gt;=95%</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500">
                                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
                                    <div key={day} className="py-1">{day}</div>
                                ))}
                                {heatmapData.map(h => {
                                    let bgClass = 'bg-slate-50 text-slate-400 border-slate-200';
                                    if (!h.isFuture && h.count > 0) {
                                        if (h.percentage < 70) bgClass = 'bg-sky-50 text-sky-700 border-sky-200';
                                        else if (h.percentage < 85) bgClass = 'bg-sky-100 text-sky-800 border-sky-300';
                                        else if (h.percentage < 95) bgClass = 'bg-sky-600 text-white border-sky-600';
                                        else bgClass = 'bg-blue-900 text-white border-blue-900';
                                    }

                                    return (
                                        <div
                                            key={h.day}
                                            title={`Tanggal ${h.day}: ${h.count}/16 slot (${h.percentage}%)`}
                                            className={`rounded-xl p-3 flex flex-col items-center justify-center transition border ${bgClass} ${
                                                h.isToday ? 'border-2 border-sky-600 font-extrabold shadow-sm' : ''
                                            }`}
                                        >
                                            <span className="font-extrabold text-sm">{h.day}</span>
                                            <span className="text-[10px] mt-0.5 font-medium">{h.isFuture ? '–' : `${h.percentage}%`}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ROLE C: ADMIN DASHBOARD */}
                {user.role === 'admin' && (
                    <div className="space-y-8">
                        {/* THREE NUMBER CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl border border-sky-100/80 p-6 shadow-sm shadow-sky-100/30 space-y-2">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Alat Aktif</span>
                                    <Wrench className="w-4 h-4 text-sky-600" />
                                </div>
                                <div className="text-3xl font-extrabold text-slate-900">{activeInstruments} <span className="text-sm font-bold text-slate-500">dari {totalInstruments} Alat</span></div>
                                <p className="text-[11px] text-slate-400 font-medium">Status alat terkonfigurasi di Kelola Alat</p>
                            </div>

                            <div className="bg-white rounded-2xl border border-sky-100/80 p-6 shadow-sm shadow-sky-100/30 space-y-2">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Pengguna Terdaftar</span>
                                    <Users className="w-4 h-4 text-sky-600" />
                                </div>
                                <div className="text-3xl font-extrabold text-slate-900">{roleBreakdown.pengamat + roleBreakdown.penyelia + roleBreakdown.admin} <span className="text-sm font-bold text-slate-500">Akun</span></div>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    {roleBreakdown.pengamat} Pengamat · {roleBreakdown.penyelia} Penyelia · {roleBreakdown.admin} Admin
                                </p>
                            </div>
                        </div>

                        {/* INSTRUMENT STATUS GRID */}
                        <div className="bg-white rounded-2xl border border-sky-100/80 p-6 shadow-sm shadow-sky-100/30 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                                    <Wrench className="w-5 h-5 text-sky-600" />
                                    <span>Grid Status Alat Pengamatan</span>
                                </h3>
                                <Link href={route('admin.instruments.index')} className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center space-x-1">
                                    <span>Kelola Alat</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {instrumentStatusGrid.map(inst => (
                                    <div
                                        key={inst.id}
                                        onClick={() => window.location.href = route('admin.instruments.index')}
                                        className="p-4 rounded-xl border border-sky-100 hover:border-sky-300 bg-slate-50/50 hover:bg-white transition cursor-pointer flex items-start space-x-3"
                                    >
                                        <span className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                                            inst.status === 'aktif' ? 'bg-sky-500'
                                            : inst.status === 'perlu_perhatian' ? 'bg-amber-500'
                                            : 'bg-slate-400'
                                        }`} />
                                        <div>
                                            <div className="font-bold text-sm text-slate-900">{inst.nama}</div>
                                            <div className="text-xs text-slate-500 font-medium mt-0.5">{inst.statusText}</div>
                                            <div className="text-[11px] text-slate-400 mt-1">{inst.paramCount} Parameter</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL DETAIL OBSERVED SLOT (FOR PENGAMAT) */}
                {selectedSlotModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-sky-100 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900">
                                        Detail Observasi Pukul {selectedSlotModal.schedule?.jam_wib.substring(0, 5)} WIB
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">Tanggal: {selectedSlotModal.tanggal}</p>
                                </div>
                                <button onClick={() => setSelectedSlotModal(null)} className="text-slate-400 hover:text-slate-700">✕</button>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="font-bold text-slate-600">Pengamat:</span>
                                    <span>{user.nama}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="font-bold text-slate-600">Status Observasi:</span>
                                    <span className="uppercase font-bold text-sky-700">{selectedSlotModal.status_pengamatan}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="font-bold text-slate-600">Approval Penyelia:</span>
                                    <span className="uppercase font-bold text-sky-700">{selectedSlotModal.status_approval}</span>
                                </div>
                                {selectedSlotModal.status_approval === 'revision' && selectedSlotModal.catatan_supervisor && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                                        <span className="font-bold">Catatan Revisi: </span>
                                        "{selectedSlotModal.catatan_supervisor}"
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-3">
                                <button
                                    onClick={() => setSelectedSlotModal(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                                >
                                    Tutup
                                </button>
                                {selectedSlotModal.status_approval === 'revision' && (
                                    <Link
                                        href={route('observations.edit', selectedSlotModal.id)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 flex items-center space-x-1.5"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        <span>Perbaiki Observasi</span>
                                    </Link>
                                )}
                                <a
                                    href={route('observations.pdf', selectedSlotModal.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 flex items-center space-x-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>Unduh PDF</span>
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </Sidebar>
    );
}
