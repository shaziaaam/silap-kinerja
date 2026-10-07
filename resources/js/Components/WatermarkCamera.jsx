import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Upload, CheckCircle, Zap, AlertTriangle, Image as ImageIcon } from 'lucide-react';

export default function WatermarkCamera({ onCapture, isSynoptic }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [currentTime, setCurrentTime] = useState({ utc: '', wib: '' });
    
    // Emergency Mode for slow internet / camera permission failure
    const [showEmergencyUpload, setShowEmergencyUpload] = useState(false);

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

    const drawWatermarkAndCapture = (sourceImageElement, isEmergency = false) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = sourceImageElement.videoWidth || sourceImageElement.width || 1280;
        let height = sourceImageElement.videoHeight || sourceImageElement.height || 720;

        // Auto Compression: Resize image if max width > 1280px to save payload size
        const MAX_WIDTH = 1280;
        if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw original video frame or uploaded photo
        ctx.drawImage(sourceImageElement, 0, 0, width, height);

        // Realtime Watermark Overlay Banner at bottom (Clean Formal Style)
        const now = new Date();
        const timeZoneWib = 'Asia/Jakarta';
        const dateStr = now.toLocaleDateString('id-ID', { timeZone: timeZoneWib });
        const timeWib = now.toLocaleTimeString('id-ID', { timeZone: timeZoneWib });
        const timeUtc = now.toISOString().substring(11, 19) + ' UTC';

        const locationText = isEmergency
            ? "Taman Alat, Stasiun Klimatologi Jawa Tengah (BMKG) • Mode Darurat"
            : "Taman Alat, Stasiun Klimatologi Jawa Tengah (BMKG)";
        const coordText = "Lat: -6.983073°  Long: 110.409536°  Elevasi: 95 m dpl";
        const timeText = `Tanggal: ${dateStr}  |  Waktu: ${timeWib} WIB (${timeUtc})`;

        const boxHeight = Math.max(64, Math.round(height * 0.14));
        
        // Semi-transparent dark background overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, height - boxHeight, width, boxHeight);

        // Watermark Text styling (clean crisp white text)
        const fontSizeTitle = Math.max(12, Math.round(width * 0.019));
        const fontSizeSub = Math.max(10, Math.round(width * 0.015));

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSizeTitle}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(locationText, 16, height - boxHeight + Math.round(boxHeight * 0.32));

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `${fontSizeSub}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(coordText, 16, height - boxHeight + Math.round(boxHeight * 0.60));
        ctx.fillText(timeText, 16, height - boxHeight + Math.round(boxHeight * 0.85));

        // Compress WebP output with quality = 0.80
        const compressedDataUrl = canvas.toDataURL('image/webp', 0.80);
        setCapturedImage(compressedDataUrl);
        onCapture(compressedDataUrl);
        stopCamera();
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            drawWatermarkAndCapture(videoRef.current, false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const img = new Image();
        img.onload = () => {
            drawWatermarkAndCapture(img, true);
        };
        img.src = URL.createObjectURL(file);
    };

    const resetPhoto = () => {
        setCapturedImage(null);
        onCapture(null);
    };

    return (
        <div className="space-y-4">
            {/* Hidden Canvas for Watermark & Compression */}
            <canvas ref={canvasRef} className="hidden" />

            {!capturedImage ? (
                <div className="space-y-4">
                    {isCameraActive ? (
                        <div className="relative rounded-xl overflow-hidden bg-black border border-slate-200">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                            <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur text-xs px-3 py-1.5 rounded-lg text-emerald-300 border border-slate-700 font-medium">
                                📍 Taman Alat Jateng | {currentTime.wib}
                            </div>
                            <div className="absolute bottom-3 right-3 flex space-x-2">
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-lg flex items-center space-x-2"
                                >
                                    <Camera className="w-4 h-4" />
                                    <span>Ambil Foto Realtime</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-emerald-200 rounded-xl p-6 sm:p-8 text-center bg-emerald-50/30">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Camera className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-slate-800 font-bold mb-1">
                                Ambil Foto Bukti Pengamatan Secara Live
                            </p>
                            <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                                Pengamatan diwajibkan mengambil foto bukti langsung di lokasi. Foto otomatis dikompresi dan diberi watermark waktu &amp; lokasi BMKG.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-md shadow-emerald-600/20"
                                >
                                    <Camera className="w-4 h-4" />
                                    <span>Buka Kamera Web Live</span>
                                </button>

                                {/* Direct HP Native Camera Trigger */}
                                <label className="cursor-pointer inline-flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm">
                                    <Camera className="w-4 h-4 text-emerald-700" />
                                    <span>Foto via Kamera HP</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Mode Darurat (Instant Access without waiting) */}
                    <div className="pt-2 border-t border-slate-100">
                        {showEmergencyUpload ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-3">
                                <div className="flex items-center space-x-2 text-amber-900 font-bold">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Mode Upload Darurat (Kendala Jaringan / Perangkat)</span>
                                </div>
                                <p className="text-amber-800 leading-relaxed">
                                    Pilih foto dari galeri HP jika lokasi bermasalah atau sinyal buruk. Foto tetap akan otomatis dikompresi &amp; diberi watermark timestamp BMKG.
                                </p>
                                <div className="flex items-center space-x-3">
                                    <label className="cursor-pointer inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl transition shadow">
                                        <ImageIcon className="w-4 h-4" />
                                        <span>Pilih Foto dari Galeri</span>
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg, image/jpg, image/webp"
                                            onChange={handleFileUpload}
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
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
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
                    <div className="relative rounded-xl overflow-hidden border border-emerald-300 shadow-md">
                        <img src={capturedImage} alt="Captured Watermarked" className="w-full h-64 object-cover" />
                        <div className="absolute top-3 left-3 bg-emerald-800 text-white text-xs px-3 py-1 rounded-full border border-emerald-600 flex items-center space-x-1.5 shadow">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                            <span className="font-bold">Foto Ber-Watermark &amp; Terkompresi Siap Kirim</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={resetPhoto}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Foto Ulang / Ganti Gambar</span>
                    </button>
                </div>
            )}
        </div>
    );
}
