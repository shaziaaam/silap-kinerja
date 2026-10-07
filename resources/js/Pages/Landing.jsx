import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    CloudSun,
    FileSpreadsheet,
    ShieldCheck,
    MapPin,
    Phone,
    Mail,
    ExternalLink,
    LogIn,
    Award,
    Clock,
    Building2,
    Users,
    ArrowRight,
    HelpCircle,
    AlertTriangle,
    FileCheck,
    Menu,
    X,
} from 'lucide-react';

const heroSlides = [
    { img: '/images/1.png', label: 'Gedung Utama Stasiun Klimatologi Klas I Jawa Tengah' },
    { img: '/images/2.png', label: 'Taman Alat Observasi AWS & Pengamatan Manual' },
    { img: '/images/4.png', label: 'Kantor Stasiun Klimatologi Jawa Tengah (Semarang)' },
    { img: '/images/3.png', label: 'Area Operasional Stasiun Klimatologi Jawa Tengah' },
    { img: '/images/5.png', label: 'Fasilitas & Ruang Pengamatan Stasiun Klimatologi Jawa Tengah' },
];

export default function Landing() {
    const { auth } = usePage().props || {};

    // Auto-cycling hero slideshow
    const [currentSlide, setCurrentSlide] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Sliding navbar glass pill state
    const navRef = useRef(null);
    const [pillStyle, setPillStyle] = useState({ opacity: 0, left: 0, width: 0 });

    const handleNavItemMouseEnter = (e) => {
        if (!navRef.current) return;
        const itemRect = e.currentTarget.getBoundingClientRect();
        const navRect = navRef.current.getBoundingClientRect();
        setPillStyle({
            opacity: 1,
            left: itemRect.left - navRect.left,
            width: itemRect.width,
        });
    };

    const handleNavMouseLeave = () => {
        setPillStyle((prev) => ({ ...prev, opacity: 0 }));
    };

    return (
        <div className="min-h-screen bg-[#0f4a2a] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
            <Head title="Beranda - Stasiun Klimatologi Jawa Tengah | SILAP-Kinerja BMKG" />

            {/* ── Sticky Header (Clean White Glass Navbar) ─────────────────────────── */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Brand */}
                    <Link href="/" className="flex items-center space-x-2.5 group shrink-0">
                        <img src="/images/logo hitam.webp" alt="Logo BMKG" className="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition duration-300" />
                        <div>
                            <div className="font-extrabold text-slate-900 text-lg tracking-tight leading-none">SILAP-Kinerja</div>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">BMKG Staklim Jawa Tengah</p>
                        </div>
                    </Link>

                    {/* Clean Navbar Links (Desktop) */}
                    <nav
                        ref={navRef}
                        onMouseLeave={handleNavMouseLeave}
                        className="hidden md:flex items-center relative space-x-1"
                    >
                        {/* Smooth sliding glass pill indicator */}
                        <div
                            className="absolute top-0 bottom-0 rounded-full bg-slate-100 shadow-sm border border-slate-200/80 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
                            style={{
                                opacity: pillStyle.opacity,
                                transform: `translateX(${pillStyle.left}px)`,
                                width: `${pillStyle.width}px`,
                            }}
                        />

                        <a
                            onMouseEnter={handleNavItemMouseEnter}
                            href="#tentang"
                            className="relative z-10 px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-colors duration-200"
                        >
                            Tentang Staklim
                        </a>
                        <a
                            onMouseEnter={handleNavItemMouseEnter}
                            href="#sistem"
                            className="relative z-10 px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-colors duration-200"
                        >
                            SILAP-Kinerja
                        </a>
                        <a
                            onMouseEnter={handleNavItemMouseEnter}
                            href="#lokasi"
                            className="relative z-10 px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-colors duration-200"
                        >
                            Lokasi &amp; Kontak
                        </a>
                        <a
                            onMouseEnter={handleNavItemMouseEnter}
                            href="#faq"
                            className="relative z-10 px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-colors duration-200"
                        >
                            FAQ
                        </a>
                    </nav>

                    {/* Desktop CTA Button & Mobile Hamburger Toggle */}
                    <div className="flex items-center space-x-2.5 shrink-0">
                        {auth?.user ? (
                            <Link href={route('dashboard')} className="hidden md:inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2 rounded-full shadow-sm shadow-emerald-600/20 transition duration-200 shrink-0">
                                <span>Dashboard</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <Link href={route('login')} className="hidden md:inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2 rounded-full shadow-sm shadow-emerald-600/20 transition duration-200 shrink-0">
                                <LogIn className="w-4 h-4" />
                                <span>Login Pegawai</span>
                            </Link>
                        )}

                        {/* Mobile Hamburger Toggle Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition border border-slate-200"
                            aria-label="Toggle Menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 space-y-2 shadow-xl">
                        <a
                            href="#tentang"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 rounded-xl text-base font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
                        >
                            Tentang Staklim
                        </a>
                        <a
                            href="#sistem"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 rounded-xl text-base font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
                        >
                            SILAP-Kinerja
                        </a>
                        <a
                            href="#lokasi"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 rounded-xl text-base font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
                        >
                            Lokasi &amp; Kontak
                        </a>
                        <a
                            href="#faq"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 rounded-xl text-base font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition"
                        >
                            FAQ
                        </a>

                        <div className="pt-3 border-t border-slate-200">
                            {auth?.user ? (
                                <Link
                                    href={route('dashboard')}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base px-6 py-3 rounded-full shadow-md transition"
                                >
                                    <span>Buka Dashboard</span>
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base px-6 py-3 rounded-full shadow-md transition"
                                >
                                    <LogIn className="w-5 h-5" />
                                    <span>Masuk / Login Pegawai</span>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* ══════════════════════════════════════════════════════════════════
                SECTION 1 — HERO WITH AUTOMATIC BACKGROUND SLIDESHOW
                Bottom edge has smooth gradient mask fading into BMKG Green (#0f4a2a)
            ══════════════════════════════════════════════════════════════════ */}
            <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center overflow-hidden">
                {/* Auto-cycling Background Slideshow */}
                {heroSlides.map((slide, i) => (
                    <div
                        key={slide.img}
                        className="absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none"
                        style={{ opacity: i === currentSlide ? 1 : 0 }}
                    >
                        <img
                            src={slide.img}
                            alt={slide.label}
                            className="w-full h-full object-cover object-center"
                        />
                    </div>
                ))}

                {/* BMKG Green Gradient Mask */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'linear-gradient(180deg, rgba(15,74,42,0.40) 0%, rgba(15,74,42,0.75) 60%, #0f4a2a 100%)',
                    }}
                />

                {/* Hero Centered Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex flex-col items-center">
                    <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                        SILAP-Kinerja
                    </h1>

                    <p className="mt-6 text-emerald-100/95 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed drop-shadow-sm font-normal">
                        Platform terpadu pencatatan observasi cuaca operasional harian, validasi supervisor, dan penyusunan bukti dukung SKP Pegawai BMKG Staklim Jawa Tengah.
                    </p>

                    {/* Oval CTA Buttons */}
                    <div className="mt-9 flex flex-col sm:flex-row items-center justify-center space-y-3.5 sm:space-y-0 sm:space-x-4 w-full max-w-md sm:max-w-none">
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center justify-center space-x-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold px-8 py-3.5 rounded-full shadow-lg shadow-emerald-950/40 transition duration-200 text-base"
                            >
                                <span>Buka Dashboard</span>
                                <ArrowRight className="w-4.5 h-4.5" />
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="inline-flex items-center justify-center space-x-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold px-8 py-3.5 rounded-full shadow-lg shadow-emerald-950/40 transition duration-200 text-base"
                            >
                                <LogIn className="w-4.5 h-4.5" />
                                <span>Masuk ke SILAP-Kinerja</span>
                            </Link>
                        )}
                        <a
                            href="https://staklim-jateng.bmkg.go.id/"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold px-8 py-3.5 rounded-full backdrop-blur-md transition duration-200 text-base"
                        >
                            <span>Web Resmi BMKG Jateng</span>
                            <ExternalLink className="w-4.5 h-4.5 text-emerald-300" />
                        </a>
                    </div>
                </div>

                {/* Subtle Indicator Dots for Auto Slideshow */}
                <div className="relative z-10 flex space-x-2 pb-8">
                    {heroSlides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            className={`transition-all duration-300 rounded-full ${
                                i === currentSlide ? 'w-8 h-2 bg-emerald-300' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                            }`}
                        />
                    ))}
                </div>
            </section>

            {/* ── Stats Bar (On BMKG Green Background) ─────────────────────────── */}
            <section className="bg-[#0a381f] border-y border-white/10 relative z-20">
                <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 text-center gap-4 sm:gap-0">
                    <div className="px-4 py-2 sm:py-0">
                        <p className="text-3xl font-black text-emerald-300 tracking-tight">35</p>
                        <p className="text-xs font-semibold text-emerald-100/75 uppercase tracking-wider mt-1">Kabupaten & Kota Tercover</p>
                    </div>
                    <div className="px-4 py-2 sm:py-0">
                        <p className="text-3xl font-black text-emerald-300 tracking-tight">07.00 – 22.00 WIB</p>
                        <p className="text-xs font-semibold text-emerald-100/75 uppercase tracking-wider mt-1">Jam Operasional Pengamatan</p>
                    </div>
                    <div className="px-4 py-2 sm:py-0">
                        <p className="text-3xl font-black text-emerald-300 tracking-tight">100%</p>
                        <p className="text-xs font-semibold text-emerald-100/75 uppercase tracking-wider mt-1">Digitalisasi Validasi SKP</p>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════════
                SECTION 2 — SILAP-KINERJA (BMKG GREEN SOLID COLOR BACKGROUND)
            ══════════════════════════════════════════════════════════════════ */}
            <section id="sistem" className="py-24 bg-[#0f4a2a] relative overflow-hidden">
                {/* Subtle Radial Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-14 text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Apa itu SILAP-Kinerja?
                        </h2>
                        <p className="text-emerald-100/80 text-sm sm:text-base mt-3 leading-relaxed">
                            Aplikasi web pencatatan observasi cuaca operasional dan penyusunan bukti dukung SKP resmi untuk ASN Stasiun Klimatologi Jawa Tengah.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <CloudSun className="w-6 h-6 text-emerald-300" />,
                                title: 'Pencatatan Observasi Harian',
                                desc: 'Pengamat memasukkan data fisik cuaca dari alat AWS dan pengamatan manual secara realtime lengkap dengan unggah bukti foto ber-watermark otomatis.',
                            },
                            {
                                icon: <ShieldCheck className="w-6 h-6 text-emerald-300" />,
                                title: 'Verifikasi & Approval Penyelia',
                                desc: 'Penyelia memeriksa keabsahan nilai parameter cuaca serta lampiran foto dukung sebelum disetujui untuk masuk ke rekapitulasi resmi.',
                            },
                            {
                                icon: <FileSpreadsheet className="w-6 h-6 text-emerald-300" />,
                                title: 'Generasi Dokumen SKP PDF',
                                desc: 'Data terverifikasi dikalkulasi secara otomatis menjadi laporan rekapitulasi bukti dukung SKP bulanan yang siap cetak format PDF BMKG.',
                            },
                        ].map((item) => (
                            <div key={item.title} className="bg-white/10 border border-white/15 backdrop-blur-md p-8 rounded-3xl hover:border-emerald-300/40 hover:bg-white/15 transition duration-300">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-900/80 border border-emerald-600/50 flex items-center justify-center mb-6">
                                    {item.icon}
                                </div>
                                <h3 className="font-bold text-white text-lg mb-3">{item.title}</h3>
                                <p className="text-emerald-100/80 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════════
                SECTION 3 — TENTANG STAKLIM JATENG
                OPTION 1 REDESIGN: Clean Split & 2x2 Feature Grid (Rapi, Sejajar, No Nested Cards)
            ══════════════════════════════════════════════════════════════════ */}
            <section id="tentang" className="relative py-28 overflow-hidden">
                {/* Background Photo 4.png */}
                <img
                    src="/images/4.png"
                    alt="Papan Nama Staklim Jateng"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />

                {/* BMKG Green Gradient Overlay with smooth top & bottom edge fade into #0f4a2a */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(180deg, #0f4a2a 0%, rgba(15,74,42,0.88) 25%, rgba(15,74,42,0.88) 75%, #0f4a2a 100%)',
                    }}
                />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Left Column: Clean Featured Photo Card (Papan Nama Staklim) */}
                        <div className="lg:col-span-5 order-2 lg:order-1">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 group">
                                <img
                                    src="/images/4.png"
                                    alt="Kantor Utama BMKG Stasiun Klimatologi Jawa Tengah"
                                    className="w-full h-80 lg:h-[460px] object-cover group-hover:scale-105 transition duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-6">
                                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Kantor UPT Kelas I</span>
                                    <p className="text-white font-semibold text-sm mt-1">Jl. Siliwangi No. 291, Semarang Barat, Kota Semarang</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Clean Typography & 2x2 Feature Grid */}
                        <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                                    Stasiun Klimatologi Jawa Tengah
                                </h2>
                                <p className="text-emerald-100/90 text-sm sm:text-base mt-4 leading-relaxed font-normal">
                                    Unit Pelaksana Teknis (UPT) Kelas I di bawah Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) yang bertugas melaksanakan pengamatan iklim, pengolahan data klimatologi, dan penyediaan layanan informasi iklim terpercaya di 35 Kabupaten/Kota Jawa Tengah.
                                </p>
                            </div>

                            {/* Clean 2x2 Feature Grid (No nested cards inside cards) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="flex items-start space-x-3.5 p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                                    <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 shrink-0 font-bold mt-0.5">
                                        <Award className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Tugas & Fungsi UPT</h4>
                                        <p className="text-emerald-100/80 text-xs mt-1 leading-relaxed">
                                            Pengamatan iklim operasional, analisis curah hujan, pemantauan kekeringan, dan analisis PM2.5.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3.5 p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                                    <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 shrink-0 font-bold mt-0.5">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Informasi Iklim Publik</h4>
                                        <p className="text-emerald-100/80 text-xs mt-1 leading-relaxed">
                                            Prakiraan musim hujan & kemarau, buletin klimatologi, dan analisis atmosfer Jawa Tengah.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3.5 p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                                    <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 shrink-0 font-bold mt-0.5">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Peringatan Dini HTH</h4>
                                        <p className="text-emerald-100/80 text-xs mt-1 leading-relaxed">
                                            Monitoring Hari Tanpa Hujan & analisis potensi kekeringan untuk sektor pertanian & bencana.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3.5 p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                                    <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 shrink-0 font-bold mt-0.5">
                                        <FileCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Rekap SKP Digital</h4>
                                        <p className="text-emerald-100/80 text-xs mt-1 leading-relaxed">
                                            Pencatatan observasi & validasi supervisor otomatis untuk bukti dukung SKP pegawai BMKG.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════════
                SECTION 4 — LOKASI & KONTAK (BMKG GREEN SOLID COLOR BACKGROUND)
            ══════════════════════════════════════════════════════════════════ */}
            <section id="lokasi" className="py-24 bg-[#0f4a2a] relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-14">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Alamat & Kontak Stasiun
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                        {/* Info Card */}
                        <div className="lg:col-span-5 bg-white/10 border border-white/15 backdrop-blur-md p-8 rounded-3xl flex flex-col justify-between space-y-6">
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3.5 border-b border-white/15 pb-4">
                                    <img src="/images/BMKG.png" alt="BMKG Logo" className="w-10 h-10 object-contain" />
                                    <div>
                                        <h3 className="font-extrabold text-base text-white">BMKG Staklim Jateng</h3>
                                        <p className="text-xs font-semibold text-emerald-300">Kota Semarang, Jawa Tengah</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3 text-sm">
                                        <MapPin className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                                        <p className="text-emerald-100/90 leading-relaxed">
                                            <strong className="text-white">Jl. Siliwangi No. 291</strong>, Kalibanteng Kulon, Kec. Semarang Barat, Kota Semarang, Jawa Tengah 50145
                                        </p>
                                    </div>

                                    <div className="flex items-center space-x-3 text-sm">
                                        <Phone className="w-5 h-5 text-emerald-300 shrink-0" />
                                        <span className="text-emerald-100/90 font-medium">(024) 7607750</span>
                                    </div>

                                    <div className="flex items-center space-x-3 text-sm">
                                        <Mail className="w-5 h-5 text-emerald-300 shrink-0" />
                                        <span className="text-emerald-100/90 font-medium">staklim.semarang@bmkg.go.id</span>
                                    </div>

                                    <div className="flex items-center space-x-3 text-sm">
                                        <Clock className="w-5 h-5 text-emerald-300 shrink-0" />
                                        <span className="text-emerald-100/90 font-medium">Jam Operasional: 07.00 – 22.00 WIB</span>
                                    </div>
                                </div>
                            </div>

                            {/* Photo 3 Display & Map Link */}
                            <div className="pt-4 border-t border-white/15 space-y-3">
                                <div className="relative rounded-2xl overflow-hidden h-32 border border-white/20">
                                    <img src="/images/3.png" alt="Stasiun Klimatologi Semarang" className="w-full h-full object-cover" />
                                </div>

                                <a
                                    href="https://maps.google.com/?q=Stasiun+Klimatologi+Jawa+Tengah"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full inline-flex items-center justify-center space-x-2 text-xs text-white hover:text-emerald-200 font-bold bg-white/15 hover:bg-white/25 py-3 rounded-full transition border border-white/25"
                                >
                                    <span>Buka Petunjuk Arah Google Maps</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
                                </a>
                            </div>
                        </div>

                        {/* Google Maps Embed */}
                        <div className="lg:col-span-7 bg-white/10 rounded-3xl overflow-hidden shadow-sm border border-white/15 min-h-[380px]">
                            <iframe
                                title="Peta Lokasi Staklim Jateng"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.297405284306!2d110.378945!3d-6.974127!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e708b5e9fbfb6b5%3A0x6b63d9059f338d81!2sStasiun%20Klimatologi%20Semarang!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                                className="w-full h-full min-h-[380px] border-0"
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════════
                SECTION 5 — FAQ (BMKG GREEN SOLID COLOR BACKGROUND)
            ══════════════════════════════════════════════════════════════════ */}
            <section id="faq" className="py-24 bg-[#0f4a2a] border-t border-white/10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-12">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Pertanyaan Umum (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/10 border border-white/15 backdrop-blur-md p-6 rounded-2xl">
                            <h3 className="font-bold text-white text-base flex items-center space-x-2.5">
                                <HelpCircle className="w-5 h-5 text-emerald-300 shrink-0" />
                                <span>Apakah masyarakat umum perlu login di SILAP-Kinerja?</span>
                            </h3>
                            <div className="text-emerald-100/80 text-sm mt-3 leading-relaxed pl-7">
                                <strong className="text-white">Tidak.</strong> SILAP-Kinerja adalah aplikasi <em>Internal Intranet</em> untuk pencatatan kinerja operasional pegawai BMKG. Bagi masyarakat umum yang memerlukan informasi iklim Jawa Tengah, silakan kunjungi{' '}
                                <a href="https://staklim-jateng.bmkg.go.id/" target="_blank" rel="noreferrer" className="text-emerald-300 font-bold underline hover:text-emerald-200">
                                    Website Resmi BMKG Staklim Jateng
                                </a>.
                            </div>
                        </div>

                        <div className="bg-white/10 border border-white/15 backdrop-blur-md p-6 rounded-2xl">
                            <h3 className="font-bold text-white text-base flex items-center space-x-2.5">
                                <Users className="w-5 h-5 text-emerald-300 shrink-0" />
                                <span>Apa saja 3 Role Akses di SILAP-Kinerja?</span>
                            </h3>
                            <div className="text-emerald-100/80 text-sm mt-3 leading-relaxed pl-7">
                                <ul className="list-disc space-y-1.5 pl-4">
                                    <li><strong className="text-white">Pengamat (Observer):</strong> Memasukkan data pengamatan harian dan foto bukti dukung SKP.</li>
                                    <li><strong className="text-white">Penyelia (Supervisor):</strong> Meninjau, memvalidasi laporan, dan men-generate dokumen SKP resmi.</li>
                                    <li><strong className="text-white">Administrator:</strong> Mengelola data akun pegawai (NIP, Nama, Jabatan) dan kata sandi.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════════
                FOOTER
            ══════════════════════════════════════════════════════════════════ */}
            <footer className="bg-[#092e1a] text-slate-400 py-10 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-3">
                        <img src="/images/BMKG.png" alt="BMKG Logo" className="w-8 h-8 object-contain" />
                        <span className="text-white font-bold text-sm">
                            SILAP-Kinerja | BMKG Staklim Jawa Tengah
                        </span>
                    </div>
                    <p className="text-xs text-slate-400">
                        © 2026 BMKG Stasiun Klimatologi Jawa Tengah. Hak Cipta Dilindungi Undang-Undang.
                    </p>
                </div>
            </footer>
        </div>
    );
}
