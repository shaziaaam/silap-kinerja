import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Upload, CheckCircle, Zap, AlertTriangle, Image as ImageIcon } from 'lucide-react';

const DEFAULT_GEOTAG = {
    peta_aktif: true,
    tile_url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    zoom: 16,
    atribusi: '© OpenStreetMap',
    alamat_aktif: true,
    alamat_url: 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=id&lat={lat}&lon={lng}',
};

/**
 * Fetch the slippy-map tiles covering a square around (lat, lng) and compose them
 * into an off-screen canvas. Returns null when tiles are unreachable so capture is
 * never blocked by the network.
 */
async function buatThumbnailPeta({ lat, lng, zoom, tileUrl, size = 256, timeoutMs = 4000 }) {
    const TILE = 256;
    const n = Math.pow(2, zoom);
    const latRad = (lat * Math.PI) / 180;
    const px = ((lng + 180) / 360) * n * TILE;
    const py = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * TILE;

    const left = px - size / 2;
    const top = py - size / 2;
    const x0 = Math.floor(left / TILE);
    const x1 = Math.floor((left + size - 1) / TILE);
    const y0 = Math.floor(top / TILE);
    const y1 = Math.floor((top + size - 1) / TILE);

    const muat = (url) => new Promise((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => resolve(null), timeoutMs);
        img.crossOrigin = 'anonymous';
        img.onload = () => { clearTimeout(timer); resolve(img); };
        img.onerror = () => { clearTimeout(timer); resolve(null); };
        img.src = url;
    });

    const permintaan = [];
    for (let tx = x0; tx <= x1; tx++) {
        for (let ty = y0; ty <= y1; ty++) {
            const url = tileUrl
                .replace('{z}', zoom)
                .replace('{x}', ((tx % n) + n) % n)
                .replace('{y}', ty);
            permintaan.push(muat(url).then(img => ({ img, tx, ty })));
        }
    }

    const hasil = await Promise.all(permintaan);
    if (!hasil.some(t => t.img)) return null;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, size, size);

    hasil.forEach(({ img, tx, ty }) => {
        if (img) ctx.drawImage(img, tx * TILE - left, ty * TILE - top, TILE, TILE);
    });

    // Marker at the exact position, which is the centre of the crop.
    const c = size / 2;
    ctx.beginPath();
    ctx.arc(c, c, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    return canvas;
}

/**
 * Reverse-geocode coordinates into a place name ("Semarang, Jawa Tengah, Indonesia")
 * and a full address, like common geotag cameras. Returns null when offline.
 */
async function cariAlamat({ lat, lng, url, timeoutMs = 5000 }) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url.replace('{lat}', lat.toFixed(6)).replace('{lng}', lng.toFixed(6)), { signal: ctrl.signal });
        if (!res.ok) return null;
        const data = await res.json();
        const a = data.address || {};
        const kota = a.city || a.town || a.municipality || a.county || a.village || a.suburb;
        const judul = [kota, a.state, a.country].filter(Boolean).join(', ');
        // Street-level address only, without shop or building names
        const lengkap = [a.road, a.village || a.suburb || a.neighbourhood, a.city_district, kota, a.state, a.postcode, a.country]
            .filter((v, i, arr) => v && arr.indexOf(v) === i)
            .join(', ');
        return judul ? { judul, lengkap } : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Google Plus Code (Open Location Code), 10 digits (~14 m), e.g. "6P5G2CJ4+QQ".
 * Computed offline; integer maths in 1/8000-degree units avoids float drift.
 */
function plusCode(lat, lng) {
    const A = '23456789CFGHJMPQRVWX';
    let la = Math.floor((Math.min(Math.max(lat, -90), 90 - 1e-9) + 90) * 8000);
    let lo = Math.floor((((lng + 180) % 360 + 360) % 360) * 8000);
    let code = '';
    for (const div of [160000, 8000, 400, 20, 1]) {
        const dLa = Math.floor(la / div);
        const dLo = Math.floor(lo / div);
        la -= dLa * div;
        lo -= dLo * div;
        code += A[dLa] + A[dLo];
        if (code.length === 8) code += '+';
    }
    return code;
}

/** Split text into at most `maxLines` lines that fit `maxWidth`, ellipsizing the last. */
function bungkusTeks(ctx, teks, maxWidth, maxLines) {
    if (ctx.measureText(teks).width <= maxWidth) return [teks];
    const kata = teks.split(/\s+/);
    const baris = [];
    let cur = '';
    let terpotong = false;
    for (const k of kata) {
        const coba = cur ? `${cur} ${k}` : k;
        if (ctx.measureText(coba).width <= maxWidth || !cur) {
            cur = coba;
        } else {
            baris.push(cur);
            cur = k;
            if (baris.length === maxLines) { terpotong = true; break; }
        }
    }
    if (!terpotong && cur) baris.push(cur);
    if (terpotong || ctx.measureText(baris[baris.length - 1]).width > maxWidth) {
        let akhir = baris[maxLines - 1];
        while (akhir && ctx.measureText(`${akhir}…`).width > maxWidth) akhir = akhir.slice(0, -1);
        baris[maxLines - 1] = `${akhir}…`;
    }
    return baris;
}

export default function WatermarkCamera({ onCapture, geotag }) {
    const konfGeotag = { ...DEFAULT_GEOTAG, ...(geotag || {}) };
    const atribusiPeta = konfGeotag.atribusi;
    const mapCanvasRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [currentTime, setCurrentTime] = useState({ utc: '', wib: '' });
    
    // Device position (null until the GPS answers; never a made-up fallback) and its address
    const [geoCoords, setGeoCoords] = useState(null);
    const [alamat, setAlamat] = useState(null);
    
    // Emergency Mode for slow internet / camera permission failure
    const [showEmergencyUpload, setShowEmergencyUpload] = useState(false);
    const [memprosesGaleri, setMemprosesGaleri] = useState(false);

    // Follow the device position while the form is open, so a capture is stamped instantly.
    useEffect(() => {
        if (!navigator.geolocation) return undefined;
        const id = navigator.geolocation.watchPosition(
            (pos) => setGeoCoords({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                alt: pos.coords.altitude != null ? Math.round(pos.coords.altitude) : null,
                accuracy: pos.coords.accuracy ?? null,
            }),
            () => {},
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
        return () => navigator.geolocation.clearWatch(id);
    }, []);

    // Address for the current position; ~10 m rounding avoids a lookup on every GPS tick.
    const latKunci = geoCoords ? geoCoords.lat.toFixed(4) : null;
    const lngKunci = geoCoords ? geoCoords.lng.toFixed(4) : null;
    useEffect(() => {
        if (!geoCoords || !konfGeotag.alamat_aktif) return undefined;
        let dibatalkan = false;
        cariAlamat({ lat: geoCoords.lat, lng: geoCoords.lng, url: konfGeotag.alamat_url })
            // Tag the result with the position it belongs to (see kunciPosisi below).
            .then((hasil) => { if (!dibatalkan) setAlamat(hasil ? { ...hasil, kunci: `${latKunci},${lngKunci}` } : null); });
        return () => { dibatalkan = true; };
    }, [latKunci, lngKunci, konfGeotag.alamat_aktif, konfGeotag.alamat_url]);

    // Live clock update for watermark preview
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const utcStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
            const wibStr = now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';
            setCurrentTime({ utc: utcStr, wib: wibStr });
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Prefetch the map thumbnail whenever coordinates change, so capture stays instant.
    useEffect(() => {
        let dibatalkan = false;
        if (!konfGeotag.peta_aktif || !geoCoords) {
            mapCanvasRef.current = null;
            return;
        }
        buatThumbnailPeta({
            lat: geoCoords.lat,
            lng: geoCoords.lng,
            zoom: konfGeotag.zoom,
            tileUrl: konfGeotag.tile_url,
        }).then((canvas) => {
            if (!dibatalkan) mapCanvasRef.current = canvas ? Object.assign(canvas, { kunci: `${latKunci},${lngKunci}` }) : null;
        });
        return () => { dibatalkan = true; };
    }, [latKunci, lngKunci, konfGeotag.peta_aktif, konfGeotag.zoom, konfGeotag.tile_url]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            // If browser live camera fails, auto-activate emergency fallback
            setShowEmergencyUpload(true);
            alert('Tidak dapat membuka kamera browser. Opsi Mode Darurat (Kamera HP / Galeri) telah diaktifkan.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            stream.getTracks().forEach(track => track.stop());
            setIsCameraActive(false);
        }
    };

    // `lokasiUnggah` is set for gallery uploads: { coords, peta, alamat } taken at upload time.
    // Live captures use the position fetched when the page opened.
    const drawWatermarkAndCapture = (sourceImageElement, sumber = 'kamera', lokasiUnggah = null) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = sourceImageElement.videoWidth || sourceImageElement.width || 1280;
        let height = sourceImageElement.videoHeight || sourceImageElement.height || 720;

        // Auto Compression: cap the long edge so payloads stay sane while keeping
        // enough detail for the evidence photo to be readable in the SKP appendix.
        const MAX_WIDTH = 2560;
        if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw original video frame or uploaded photo
        ctx.drawImage(sourceImageElement, 0, 0, width, height);

        // Geotag panel in the common "GPS map camera" style: map on the left; place,
        // address, coordinates and time on the right.
        const galeri = sumber === 'galeri';
        const koordinat = galeri ? lokasiUnggah?.coords : geoCoords;
        // After moving, the new address and map take a moment to load; never stamp the
        // previous place's address or map next to the new coordinates.
        const kunciPosisi = koordinat ? `${koordinat.lat.toFixed(4)},${koordinat.lng.toFixed(4)}` : null;
        const peta = galeri ? lokasiUnggah?.peta : (mapCanvasRef.current?.kunci === kunciPosisi ? mapCanvasRef.current : null);
        const tempat = galeri ? lokasiUnggah?.alamat : (alamat?.kunci === kunciPosisi ? alamat : null);

        const now = new Date();
        const tz = 'Asia/Jakarta';
        const tanggal = now.toLocaleDateString('id-ID', { timeZone: tz, day: '2-digit', month: '2-digit', year: '2-digit' });
        const jam = now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });

        const judul = koordinat
            ? (tempat?.judul || 'Lokasi GPS')
            : (galeri ? 'Lokasi unggah tidak tersedia' : 'Lokasi GPS tidak tersedia');
        const baris = [];
        if (koordinat && tempat?.lengkap) baris.push({ teks: tempat.lengkap, bungkus: 2 });
        if (koordinat) {
            baris.push({ teks: `Lat ${koordinat.lat.toFixed(6)}°` });
            baris.push({ teks: `Long ${koordinat.lng.toFixed(6)}°` });
            baris.push({ teks: `Plus Code : ${plusCode(koordinat.lat, koordinat.lng)}` });
        } else {
            baris.push({ teks: 'Izin lokasi ditolak atau GPS perangkat mati' });
        }
        baris.push({ teks: `${tanggal} ${jam} GMT +07:00` });
        // A gallery photo is stamped with the upload place and time, not the capture.
        if (galeri) baris.push({ teks: 'Foto dari galeri · lokasi & waktu saat diunggah', warna: '#fbbf24', tebal: true });

        // Compact panel (about a fifth of the photo height) so it never hides the subject.
        const m = Math.max(8, Math.round(width * 0.014));
        const pad = Math.max(6, Math.round(width * 0.008));
        const fJudul = Math.max(12, Math.round(width * 0.019));
        const fIsi = Math.max(9, Math.round(width * 0.0115));
        const sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const lh = Math.round(fIsi * 1.35);

        // Measure the text block first so the box fits it.
        const lebarBox = width - m * 2;
        const sisiPeta = peta ? Math.round(Math.min(height * 0.17, lebarBox * 0.16)) : 0;
        const xTeks = m + pad + (peta ? sisiPeta + pad : 0);
        const lebarTeks = width - m - pad - xTeks;
        ctx.font = `${fIsi}px ${sans}`;
        const barisJadi = baris.flatMap((b) => bungkusTeks(ctx, b.teks, lebarTeks, b.bungkus || 1).map((t) => ({ ...b, teks: t })));
        const tinggiTeks = Math.round(fJudul * 1.5) + barisJadi.length * lh;
        const tinggiBox = Math.max(sisiPeta, tinggiTeks) + pad * 2;
        const yBox = height - m - tinggiBox;

        const kotak = (x, y, w, h, r) => {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        };
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        kotak(m, yBox, lebarBox, tinggiBox, Math.round(pad * 1.2));
        ctx.fill();

        if (peta) {
            const yPeta = yBox + (tinggiBox - sisiPeta) / 2;
            ctx.save();
            kotak(m + pad, yPeta, sisiPeta, sisiPeta, Math.round(pad * 0.8));
            ctx.clip();
            ctx.drawImage(peta, m + pad, yPeta, sisiPeta, sisiPeta);
            if (atribusiPeta) {
                const fAtr = Math.max(8, Math.round(sisiPeta * 0.07));
                ctx.font = `${fAtr}px ${sans}`;
                ctx.fillStyle = 'rgba(255,255,255,0.75)';
                ctx.fillRect(m + pad, yPeta + sisiPeta - fAtr - 4, ctx.measureText(atribusiPeta).width + 8, fAtr + 4);
                ctx.fillStyle = '#334155';
                ctx.fillText(atribusiPeta, m + pad + 4, yPeta + sisiPeta - 4);
            }
            ctx.restore();
        }

        let y = yBox + pad + fJudul;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fJudul}px ${sans}`;
        ctx.fillText(bungkusTeks(ctx, judul, lebarTeks, 1)[0], xTeks, y);
        y += Math.round(fJudul * 0.5);

        barisJadi.forEach((b) => {
            y += lh;
            ctx.font = `${b.tebal ? 'bold ' : ''}${fIsi}px ${sans}`;
            ctx.fillStyle = b.warna || 'rgba(255,255,255,0.92)';
            ctx.fillText(b.teks, xTeks, y);
        });

        // Compress WebP output with quality = 0.80
        const compressedDataUrl = canvas.toDataURL('image/webp', 0.80);
        setCapturedImage(compressedDataUrl);
        onCapture(compressedDataUrl, sumber);
        stopCamera();
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            drawWatermarkAndCapture(videoRef.current, 'kamera');
        }
    };

    // Fresh position at the moment of a gallery upload (null when unavailable).
    const ambilLokasiSekarang = () => new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                alt: pos.coords.altitude != null ? Math.round(pos.coords.altitude) : null,
                accuracy: pos.coords.accuracy ?? null,
                isDynamic: true,
            }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
    });

    const handleFileUpload = async (e, sumber = 'kamera') => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;

        let lokasiUnggah = null;
        if (sumber === 'galeri') {
            setMemprosesGaleri(true);
            const coords = await ambilLokasiSekarang();
            const [peta, alamatUnggah] = coords
                ? await Promise.all([
                    konfGeotag.peta_aktif
                        ? buatThumbnailPeta({ lat: coords.lat, lng: coords.lng, zoom: konfGeotag.zoom, tileUrl: konfGeotag.tile_url })
                        : null,
                    konfGeotag.alamat_aktif ? cariAlamat({ lat: coords.lat, lng: coords.lng, url: konfGeotag.alamat_url }) : null,
                ])
                : [null, null];
            lokasiUnggah = { coords, peta, alamat: alamatUnggah };
        }

        const img = new Image();
        img.onload = () => {
            drawWatermarkAndCapture(img, sumber, lokasiUnggah);
            setMemprosesGaleri(false);
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => setMemprosesGaleri(false);
        img.src = URL.createObjectURL(file);
    };

    const resetPhoto = () => {
        setCapturedImage(null);
        onCapture(null, null);
    };

    return (
        <div className="space-y-4">
            {/* Hidden Canvas for Watermark & Compression */}
            <canvas ref={canvasRef} className="hidden" />

            {!capturedImage ? (
                <div className="space-y-4">
                    {isCameraActive ? (
                        <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-xs px-3 py-1.5 rounded-lg text-slate-900 border border-sky-100 font-medium shadow-xs">
                                📍 {geoCoords ? (alamat?.judul || `${geoCoords.lat.toFixed(5)}, ${geoCoords.lng.toFixed(5)}`) : 'Mencari lokasi GPS...'} | {currentTime.wib}
                            </div>
                            <div className="absolute bottom-3 right-3 flex space-x-2">
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-sm flex items-center space-x-2"
                                >
                                    <Camera className="w-4 h-4" />
                                    <span>Ambil Foto Realtime</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-sky-200 rounded-xl p-6 sm:p-8 text-center bg-white shadow-sm shadow-sky-100/50">
                            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-sky-100">
                                <Camera className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-slate-900 font-bold mb-1">
                                Ambil Foto Bukti Pengamatan Secara Live
                            </p>
                            <p className="text-xs text-slate-600 max-w-md mx-auto mb-5 leading-relaxed">
                                Ambil foto bukti langsung di lokasi. Foto otomatis dikompresi dan diberi geotag: peta, alamat, koordinat GPS, dan waktu.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm shadow-sky-600/30"
                                >
                                    <Camera className="w-4 h-4" />
                                    <span>Buka Kamera Web Live</span>
                                </button>

                                {/* Direct HP Native Camera Trigger */}
                                <label className="cursor-pointer inline-flex items-center space-x-2 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs">
                                    <Camera className="w-4 h-4 text-sky-600" />
                                    <span>Foto via Kamera HP</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => handleFileUpload(e, 'kamera')}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Mode Darurat (Instant Access without waiting) */}
                    <div className="pt-2 border-t border-sky-100">
                        {showEmergencyUpload ? (
                            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs space-y-3">
                                <div className="flex items-center space-x-2 text-amber-900 font-bold">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Mode Upload Darurat (Kendala Jaringan / Perangkat)</span>
                                </div>
                                <p className="text-amber-800 leading-relaxed">
                                    Hanya untuk keadaan darurat (kamera tidak bisa dipakai atau sinyal buruk). Foto galeri diberi geotag
                                    <strong> lokasi dan waktu saat diunggah</strong>, bukan saat dipotret, dan ditandai "foto dari galeri" untuk penyelia.
                                    Izinkan akses lokasi agar koordinat tercatat.
                                </p>
                                <div className="flex items-center space-x-3">
                                    <label className="cursor-pointer inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-xs">
                                        <ImageIcon className="w-4 h-4" />
                                        <span>{memprosesGaleri ? 'Mengambil lokasi...' : 'Pilih Foto dari Galeri'}</span>
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg, image/jpg, image/webp"
                                            onChange={(e) => handleFileUpload(e, 'galeri')}
                                            disabled={memprosesGaleri}
                                            className="hidden"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowEmergencyUpload(false)}
                                        className="text-slate-500 hover:text-slate-800 font-semibold text-xs"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-sky-100">
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span>Ada kendala sinyal atau kamera web? Anda bisa beralih ke Mode Upload Darurat kapan saja.</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowEmergencyUpload(true)}
                                    className="text-amber-700 hover:text-amber-900 font-bold underline shrink-0 text-[11px]"
                                >
                                    Mode Upload Galeri / Darurat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-sky-200 shadow-sm">
                        <img src={capturedImage} alt="Captured Watermarked" className="w-full h-64 object-cover" />
                        <div className="absolute top-3 left-3 bg-sky-600 text-white text-xs px-3 py-1 rounded-full border border-sky-500 flex items-center space-x-1.5 shadow-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                            <span className="font-bold">Foto Ber-Watermark &amp; Terkompresi Siap Kirim</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={resetPhoto}
                        className="bg-white hover:bg-sky-50 text-slate-800 border border-sky-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                        <span>Foto Ulang / Ganti Gambar</span>
                    </button>
                </div>
            )}
        </div>
    );
}
