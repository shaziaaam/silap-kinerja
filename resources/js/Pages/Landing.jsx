import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Radio,
    ShieldCheck,
    FileText,
    ArrowRight,
    CheckCircle2,
    Menu,
    X,
    ChevronDown,
    MapPin,
    Phone,
    Mail,
    ExternalLink,
    LogIn,
    Users,
    Award,
    Building2,
    Clock,
    Calendar,
    Maximize2,
    Activity,
    Info,
    Gauge,
    Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation items matching design & user specifications
const NAV_ITEMS = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'fitur', label: 'Fitur' },
    { id: 'instrumen', label: 'Instrumen' },
    { id: 'alur', label: 'Alur Kerja' },
    { id: 'faq', label: 'FAQ' },
];

export default function Landing() {
    const { auth } = usePage().props || {};
    const user = auth?.user;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('beranda');
    const [openFaqIndex, setOpenFaqIndex] = useState(0);
    const [showInstrumentsCatalog, setShowInstrumentsCatalog] = useState(false);

    // Live clock for WIB and UTC
    const [liveTime, setLiveTime] = useState({ wib: '', utc: '' });

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setLiveTime({
                wib: now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false }) + ' WIB',
                utc: now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false }) + ' UTC',
            });
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Smooth scroll to section
    const scrollToSection = (e, id) => {
        if (e) e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 76;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            setActiveSection(id);
            setMobileMenuOpen(false);
        }
    };

    // Scroll spy for active navbar indicator
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['beranda', 'fitur', 'instrumen', 'alur', 'faq'];
            const scrollPosition = window.scrollY + 120;

            for (const sectionId of sections) {
                const el = document.getElementById(sectionId);
                if (el) {
                    const top = el.offsetTop;
                    const height = el.offsetHeight;
                    if (scrollPosition >= top && scrollPosition < top + height) {
                        setActiveSection(sectionId);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const FAQ_ITEMS = [
        {
            q: "Bagaimana cara memperoleh akun?",
            a: "Akun pegawai dibuat dan dikonfigurasi secara terpusat oleh Administrator Sistem Stasiun (NIP, nama, dan peran). SILAP-Kinerja merupakan sistem operasional internal institusi BMKG dan tidak menyediakan pendaftaran mandiri publik."
        },
        {
            q: "Apa yang terjadi ketika data pengamatan perlu direvisi?",
            a: "Penyelia menandai baris observasi sebagai 'Revisi' disertai catatan koreksi spesifik pada antrean verifikasi. Pengamat terkait memperbaiki nilai yang keliru dan mengirimkan kembali form. Sistem memproteksi ketat: tombol Pengesahan ACC Triwulan otomatis terkunci selama masih ada observasi revisi yang belum diselesaikan."
        },
        {
            q: "Kapan foto bukti observasi wajib dilampirkan?",
            a: "Pengambilan foto hanya diwajibkan tepat 2 kali sehari: pada pukul 07.00 WIB (awal shift pagi) dan pukul 17.00 WIB (menjelang petang shift siang). Ke-17 slot waktu lainnya tidak memunculkan field upload foto. Watermark teks 'Taman Alat, Stasiun Klimatologi Jawa Tengah' serta stempel waktu WIB & UTC otomatis dibakar langsung sebelum diarsipkan ke Google Drive."
        },
        {
            q: "Bagaimana berkas bukti dukung SKP triwulan dapat diunduh?",
            a: "Berkas bukti dukung SKP triwulanan diterbitkan otomatis dari sistem per pegawai (berisi rekap total jam pengamatan valid, persentase keaktifan tugas, tautan bukti foto, dan lembar pengesahan penyelia). Pengemasan paket berkas seluruh pegawai tersedia khusus bagi Penyelia dan Administrator."
        },
        {
            q: "Lupa kata sandi akun, harus bagaimana?",
            a: "Silakan hubungi Administrator Sistem Stasiun Klimatologi Jawa Tengah untuk mereset kata sandi akun Anda. Saat login pertama kali setelah reset, sistem secara otomatis mewajibkan pengisian password baru (Force Change Password) sebelum membuka akses data operasional."
        }
    ];

    // Matriks instrumen & parameter operasional lengkap
    const DETAILED_INSTRUMENTS = [
        {
            group: "Otomatis (Digital & Translator)",
            badge: "AWS & WIND YOUNG",
            items: [
                { name: "Automatic Weather Station (AWS)", desc: "Suhu udara TA_meas, TA_Max, TA_Min, kelembapan RH_meas, tekanan stasiun/laut PA_QFE & PA_QFF, penakar hujan tipping bucket (rainHourly, RainDaily), radiasi surya SR_Max." },
                { name: "Wind YOUNG Model 26800", desc: "Display digital translator: kecepatan sesaat & rata-rata (AVG), peak gust (MAX), arah angin (°), dan deviasi standar (SDV)." }
            ]
        },
        {
            group: "Manual & Konvensional (Taman Alat BMKG)",
            badge: "TAMAN ALAT 7 HARI",
            items: [
                { name: "Psikrometer Sangkar (1,2 m)", desc: "Termometer Bola Kering (TBK) dan Bola Basah (TBB). Validasi wajib TBB ≤ TBK." },
                { name: "Psikrometer Assman Bertingkat", desc: "Pengukuran suhu & kelembapan vertikal dengan aspirasi mekanis pada 7 ketinggian: 5, 10, 20, 50, 100, 150, dan 200 cm (14 titik ukur)." },
                { name: "Anemometer Cup Counter", desc: "Mangkok angin 0,5 m dan 10 m pencatat kilometer jarak tempuh angin dengan kalkulasi kecepatan rata-rata otomatis." },
                { name: "Open Pan Evaporimeter Klas A", desc: "Panci penguapan dengan Hook Gauge, termometer apung maks-min, dan rumus otomatis Penguapan = Selisih Air + CH Diukur." },
                { name: "Piche Evaporimeter", desc: "Tabung kaca berskala berselang cm³ dengan piringan kertas saring (Penguapan = Sekarang - Sebelum)." },
                { name: "Termometer Tanah", desc: "Tanah gundul & berumput pada kedalaman 0, 5, 10, 20, 50, dan 100 cm sesuai standar operasional stasiun." },
                { name: "Campbell-Stokes & Gunn-Bellani", desc: "Bola kaca pias terbakar surya (0,0-1,0 jam) dan radiometer bola tembaga hitam kondensasi buret (faktor kalibrasi 20.8)." },
                { name: "Penakar Hujan Ombrometer (OBS)", desc: "Penakar hujan manual tipe corong dengan pembacaan gelas ukur kaca berskala mm setiap jam." }
            ]
        },
        {
            group: "Pengamatan Visual Langit & Lingkungan",
            badge: "KUALITATIF FIELD",
            items: [
                { name: "Jumlah Awan", desc: "Estimasi persentase luas tutupan kubah langit (0 s.d. 8 okta)." },
                { name: "Penglihatan Mendatar", desc: "Estimasi visibilitas jarak pandang objek patokan horizon dalam kilometer (km)." },
                { name: "Keadaan Tanah & Hujan", desc: "Kondisi fisik permukaan tanah (Basah / Kering / Lembab) dan status hujan (Ringan / Sedang / Lebat / Nihil)." }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-white text-[#2B3F5C] font-sans antialiased selection:bg-[#168BC5] selection:text-white">
            <Head title="SILAP-Kinerja | Stasiun Klimatologi Jawa Tengah" />

            {/* --- NAVBAR --- */}
            <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#D3E6F4] transition-all">
                <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
                    {/* Brand Identity */}
                    <a
                        href="#beranda"
                        onClick={(e) => scrollToSection(e, 'beranda')}
                        className="flex items-center gap-3 group"
                    >
                        <img
                            src="/images/logo.png"
                            alt="Logo BMKG"
                            className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="flex flex-col">
                            <span className="font-extrabold text-[17px] text-[#102B4E] leading-tight tracking-tight">
                                SILAP-Kinerja
                            </span>
                            <span className="text-[12px] font-semibold text-[#168BC5] leading-tight">
                                Staklim Jawa Tengah
                            </span>
                        </div>
                    </a>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8 relative">
                        {NAV_ITEMS.map((item) => {
                            const isActive = activeSection === item.id;
                            return (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    onClick={(e) => scrollToSection(e, item.id)}
                                    className={`relative py-1.5 text-[15px] font-semibold transition-colors duration-200 ${
                                        isActive ? 'text-[#0F6C9E] font-bold' : 'text-[#2B3F5C] hover:text-[#168BC5]'
                                    }`}
                                >
                                    {item.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNavIndicator"
                                            className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#168BC5] rounded-full"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                </a>
                            );
                        })}
                    </nav>

                    {/* Right Login / Dashboard CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <Link
                                href="/dashboard"
                                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#102B4E] via-[#0E5284] to-[#168BC5] text-white text-[14px] font-bold shadow-sm shadow-[#102B4E]/20 transition-all duration-300 hover:from-[#0B213D] hover:via-[#105F99] hover:to-[#1A9BE0] hover:shadow-md hover:shadow-[#168BC5]/25 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <span>Buka Dashboard</span>
                                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#102B4E] via-[#0E5284] to-[#168BC5] text-white text-[14px] font-bold shadow-sm shadow-[#102B4E]/20 transition-all duration-300 hover:from-[#0B213D] hover:via-[#105F99] hover:to-[#1A9BE0] hover:shadow-md hover:shadow-[#168BC5]/25 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <span>Login</span>
                                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                            </Link>
                        )}
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-[#102B4E] hover:bg-[#EAF6FF] border border-[#D3E6F4] transition-colors"
                        aria-label="Buka menu navigasi"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden border-t border-[#D3E6F4] bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg"
                        >
                            {NAV_ITEMS.map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    onClick={(e) => scrollToSection(e, item.id)}
                                    className={`block px-3 py-2.5 rounded-md text-[15px] font-semibold ${
                                        activeSection === item.id ? 'bg-[#EAF6FF] text-[#0F6C9E] font-bold' : 'text-[#2B3F5C] hover:bg-[#EAF6FF]'
                                    }`}
                                >
                                    {item.label}
                                </a>
                            ))}
                            <div className="pt-2">
                                <Link
                                    href={user ? "/dashboard" : "/login"}
                                    className="block w-full text-center py-2.5 rounded-full bg-gradient-to-r from-[#102B4E] via-[#0E5284] to-[#168BC5] text-white font-bold text-[14px] shadow-sm shadow-[#102B4E]/20 transition-all duration-300 hover:shadow-md active:scale-[0.99]"
                                >
                                    {user ? "Buka Dashboard" : "Login Pegawai"}
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <main>
                {/* --- HERO SECTION --- */}
                <section id="beranda" className="pt-10 pb-16 lg:pt-16 lg:pb-20 overflow-hidden bg-white">
                    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-8 items-center">
                            {/* Left Content Column */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="lg:col-span-5 xl:col-span-5 space-y-6 z-10"
                            >
                                {/* Main Headline: Matching user reference image */}
                                <h1 className="text-[32px] sm:text-[38px] lg:text-[40px] xl:text-[44px] font-extrabold text-[#102B4E] tracking-tight leading-[1.12]">
                                    Pengamatan Cuaca<br className="hidden sm:inline" />
                                    Terverifikasi,<br className="hidden sm:inline" />
                                    <span className="whitespace-nowrap">Pelaporan Lebih Mudah.</span>
                                </h1>

                                {/* Description Text */}
                                <p className="text-[#4B5F7A] text-[15px] sm:text-[16px] leading-relaxed max-w-lg">
                                    SILAP-Kinerja mengintegrasikan pencatatan pengamatan cuaca multi-alat, validasi data meteorologi, dokumentasi lapangan, dan penyusunan bukti dukung SKP dalam satu sistem.
                                </p>

                                {/* Action Buttons */}
                                <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
                                    <Link
                                        href={user ? "/dashboard" : "/login"}
                                        className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#102B4E] via-[#0E5284] to-[#168BC5] text-white text-[14px] sm:text-[15px] font-bold shadow-md shadow-[#102B4E]/25 transition-all duration-300 hover:from-[#0B213D] hover:via-[#105F99] hover:to-[#1A9BE0] hover:shadow-xl hover:shadow-[#168BC5]/30 hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <span>{user ? "Masuk Dashboard" : "Masuk Akun Pegawai"}</span>
                                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                                    </Link>
                                    <a
                                        href="#fitur"
                                        onClick={(e) => scrollToSection(e, 'fitur')}
                                        className="inline-flex items-center gap-2 text-[14px] sm:text-[15px] font-semibold text-[#0284C7] hover:text-[#0369A1] transition-colors"
                                    >
                                        <span>Pelajari Lebih Lanjut</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </motion.div>

                            {/* Right Visual Column: Enlarged Equipment Image */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
                                className="lg:col-span-7 xl:col-span-7 relative flex items-center justify-end"
                            >
                                <div className="relative w-full max-w-[820px] lg:scale-105 xl:scale-110 origin-right transition-transform duration-500">
                                    {/* Equipment Graphic with integrated indicator and seamless blend */}
                                    <img
                                        src="/images/hero_instruments.png?v=hero_v7_flawless"
                                        alt="Instrumen Pengamatan Cuaca Otomatis AWS dan Sensor Meteorologi BMKG"
                                        className="w-full h-auto object-contain transform hover:scale-[1.01] transition-transform duration-500 ease-out select-none"
                                        draggable="false"
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* --- NILAI UTAMA: TIGA PILAR, SATU TUJUAN --- */}
                <section className="py-16 sm:py-20 bg-[#EAF6FF] border-y border-[#D3E6F4]">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Left Pillar Title */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="lg:col-span-4 space-y-2 pr-0 lg:pr-6"
                            >
                                <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                    NILAI UTAMA
                                </span>
                                <h2 className="text-[28px] sm:text-[36px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                    Tiga Pilar, Satu Tujuan.
                                </h2>
                                <p className="text-[15px] text-[#4B5F7A] leading-relaxed pt-2">
                                    Mendukung proses pengamatan cuaca yang akurat, terdokumentasi dengan baik, dan terhubung langsung dengan penyusunan SKP pegawai Stasiun Klimatologi Jawa Tengah.
                                </p>
                            </motion.div>

                            {/* Three Pillars Cards */}
                            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {/* Pillar 1 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="bg-white rounded-2xl p-6 border border-[#D3E6F4] shadow-xs hover:border-[#168BC5]/40 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center text-[#168BC5] mb-5">
                                        <Radio className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-[19px] font-bold text-[#102B4E] mb-2">Pengamatan</h3>
                                    <p className="text-[14px] text-[#4B5F7A] leading-relaxed">
                                        Pencatatan data 19 slot harian dari sensor otomatis digital AWS, display Wind YOUNG, hingga alat konvensional taman alat.
                                    </p>
                                </motion.div>

                                {/* Pillar 2 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="bg-white rounded-2xl p-6 border border-[#D3E6F4] shadow-xs hover:border-[#168BC5]/40 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center text-[#168BC5] mb-5">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-[19px] font-bold text-[#102B4E] mb-2">Validasi</h3>
                                    <p className="text-[14px] text-[#4B5F7A] leading-relaxed">
                                        Pemeriksaan kaidah termodinamika meteorologi secara realtime (TBB ≤ TBK) serta verifikasi terpusat oleh penyelia stasiun.
                                    </p>
                                </motion.div>

                                {/* Pillar 3 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="bg-white rounded-2xl p-6 border border-[#D3E6F4] shadow-xs hover:border-[#168BC5]/40 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center text-[#168BC5] mb-5">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-[19px] font-bold text-[#102B4E] mb-2">Pelaporan</h3>
                                    <p className="text-[14px] text-[#4B5F7A] leading-relaxed">
                                        Rekapitulasi otomatis, dokumentasi foto ber-watermark cloud, hingga penerbitan lembar bukti dukung SKP triwulanan siap unggah.
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- INSTRUMEN PENGAMATAN --- */}
                <section id="instrumen" className="py-20 bg-white">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Section Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="space-y-2 max-w-xl"
                            >
                                <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                    INSTRUMEN PENGAMATAN
                                </span>
                                <h2 className="text-[32px] sm:text-[40px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                    Terintegrasi dalam Satu Sistem
                                </h2>
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="text-[15px] text-[#4B5F7A] max-w-md leading-relaxed"
                            >
                                SILAP-Kinerja mencakup seluruh instrumen pengamatan cuaca di Stasiun Klimatologi Jawa Tengah, baik otomatis digital, manual konvensional, maupun observasi visual.
                            </motion.p>
                        </div>

                        {/* 3 Real Photo Instrument Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Card 1: Otomatis */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="group bg-white rounded-2xl border border-[#D3E6F4] overflow-hidden shadow-xs hover:border-[#168BC5] hover:shadow-md transition-all duration-300 flex flex-col"
                            >
                                <div className="h-52 bg-[#F8FAFC] flex items-center justify-center p-3 overflow-hidden border-b border-[#D3E6F4]">
                                    <img
                                        src="/images/instrument_aws.png"
                                        alt="Alat Otomatis AWS dan Wind YOUNG"
                                        className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-[20px] font-bold text-[#102B4E] mb-3">Otomatis (Digital)</h3>
                                        <ul className="space-y-2 text-[14px] text-[#4B5F7A] leading-relaxed">
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong>AWS:</strong> Suhu udara, kelembapan, tekanan QFE/QFF, curah hujan, radiasi matahari.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong>Wind YOUNG 26800:</strong> Kecepatan rata-rata (AVG), peak gust (MAX), arah angin, dan deviasi standar.</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="mt-5 pt-4 border-t border-[#D3E6F4]/60 flex flex-wrap gap-1.5">
                                        <span className="text-[11px] font-mono bg-[#EAF6FF] text-[#0F6C9E] px-2 py-0.5 rounded font-medium">TA_meas</span>
                                        <span className="text-[11px] font-mono bg-[#EAF6FF] text-[#0F6C9E] px-2 py-0.5 rounded font-medium">RH_meas</span>
                                        <span className="text-[11px] font-mono bg-[#EAF6FF] text-[#0F6C9E] px-2 py-0.5 rounded font-medium">PA_QFE</span>
                                        <span className="text-[11px] font-mono bg-[#EAF6FF] text-[#0F6C9E] px-2 py-0.5 rounded font-medium">rainHourly</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 2: Manual / Konvensional */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="group bg-white rounded-2xl border border-[#D3E6F4] overflow-hidden shadow-xs hover:border-[#168BC5] hover:shadow-md transition-all duration-300 flex flex-col"
                            >
                                <div className="h-52 w-full overflow-hidden border-b border-[#D3E6F4] relative">
                                    <img
                                        src="/images/instrument_manual.png"
                                        alt="Alat Manual Sangkar Meteorologi dan Panci Penguapan"
                                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-[20px] font-bold text-[#102B4E] mb-3">Manual & Konvensional</h3>
                                        <ul className="space-y-2 text-[14px] text-[#4B5F7A] leading-relaxed">
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong>Psikrometer:</strong> Bola Kering (TBK) & Bola Basah (TBB) sangkar serta Assman 7 tingkat (5-200 cm).</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong>Evaporimeter:</strong> Panci Terbuka Klas A (Hook Gauge) dan Piche buret berskala.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong>Taman Alat:</strong> Termometer tanah (0-100 cm), Campbell-Stokes, Gunn-Bellani, OBS.</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="mt-5 pt-4 border-t border-[#D3E6F4]/60 flex flex-wrap gap-1.5">
                                        <span className="text-[11px] font-mono bg-[#EAF6FF] text-[#0F6C9E] px-2 py-0.5 rounded font-medium">TBK/TBB</span>
                                        <span className="text-[11px] font-mono bg-[#EAF6FF] text-[#0F6C9E] px-2 py-0.5 rounded font-medium">Hook Gauge</span>
                                        <span className="text-[11px] font-mono bg-[#EAF6FF] text-[#0F6C9E] px-2 py-0.5 rounded font-medium">Assman 7-Tk</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 3: Visual */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="group bg-white rounded-2xl border border-[#D3E6F4] overflow-hidden shadow-xs hover:border-[#168BC5] hover:shadow-md transition-all duration-300 flex flex-col"
                            >
                                <div className="h-52 w-full overflow-hidden border-b border-[#D3E6F4] relative">
                                    <img
                                        src="/images/instrument_visual.png"
                                        alt="Pengamatan Visual Tutupan Awan Langit"
                                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-[20px] font-bold text-[#102B4E] mb-3">Pengamatan Visual</h3>
                                        <ul className="space-y-2 text-[14px] text-[#4B5F7A] leading-relaxed">
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong>Jumlah Awan:</strong> Persentase luas tutupan kubah langit dari 0 sampai 8 okta.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong>Penglihatan Mendatar:</strong> Estimasi jarak pandang visibilitas objek patokan (km).</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong>Kondisi Permukaan:</strong> Keadaan tanah (Basah/Kering/Lembab) & hujan harian.</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="mt-5 pt-4 border-t border-[#D3E6F4]/60 flex flex-wrap gap-1.5">
                                        <span className="text-[11px] font-mono bg-[#EAF6FF] text-[#0F6C9E] px-2 py-0.5 rounded font-medium">0-8 Okta</span>
                                        <span className="text-[11px] font-mono bg-[#EAF6FF] text-[#0F6C9E] px-2 py-0.5 rounded font-medium">Visibilitas</span>
                                        <span className="text-[11px] font-mono bg-[#EAF6FF] text-[#0F6C9E] px-2 py-0.5 rounded font-medium">Tanah & Hujan</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Interactive Catalog Accordion Trigger */}
                        <div className="mt-10 text-center">
                            <button
                                onClick={() => setShowInstrumentsCatalog(!showInstrumentsCatalog)}
                                className="inline-flex items-center gap-2 text-[15px] font-bold text-[#0F6C9E] hover:text-[#168BC5] px-6 py-2.5 rounded-lg border border-[#D3E6F4] bg-[#EAF6FF]/50 hover:bg-[#EAF6FF] transition-all"
                            >
                                <span>{showInstrumentsCatalog ? "Tutup Rincian Alat & Formula" : "Lihat Semua Inventaris Alat & Parameter Lengkap"}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showInstrumentsCatalog ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Detailed Catalog Expander */}
                        <AnimatePresence>
                            {showInstrumentsCatalog && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden mt-8 pt-8 border-t border-[#D3E6F4]"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {DETAILED_INSTRUMENTS.map((grp, idx) => (
                                            <div key={idx} className="bg-[#EAF6FF]/40 rounded-xl p-5 border border-[#D3E6F4]">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-bold text-[16px] text-[#102B4E]">{grp.group}</h4>
                                                    <span className="text-[10px] font-mono font-bold bg-white text-[#168BC5] px-2 py-0.5 rounded border border-[#D3E6F4]">
                                                        {grp.badge}
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {grp.items.map((item, i) => (
                                                        <div key={i} className="text-[13px] bg-white p-3 rounded-lg border border-[#D3E6F4]/60">
                                                            <div className="font-bold text-[#102B4E]">{item.name}</div>
                                                            <p className="text-[#4B5F7A] mt-1 leading-snug">{item.desc}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* --- FITUR OPERASIONAL: LEBIH MUDAH, LEBIH TERSTRUKTUR --- */}
                <section id="fitur" className="py-20 bg-[#EAF6FF]/40 border-t border-[#D3E6F4]">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
                            {/* Left Mockup Table (Antrean Validasi & Physics Guard Card) */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="lg:col-span-6 relative"
                            >
                                <div className="bg-white rounded-2xl border border-[#D3E6F4] p-6 shadow-sm relative">
                                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#D3E6F4]">
                                        <div>
                                            <h4 className="text-[17px] font-bold text-[#102B4E]">Validasi Data</h4>
                                            <p className="text-[13px] text-[#4B5F7A]">Antrean verifikasi penyelia stasiun</p>
                                        </div>
                                        <span className="text-[11px] font-mono bg-[#EAF6FF] text-[#168BC5] font-semibold px-2.5 py-1 rounded-md">
                                            LIVE QUEUE
                                        </span>
                                    </div>

                                    {/* Table View */}
                                    <div className="divide-y divide-[#D3E6F4] text-[14px]">
                                        <div className="grid grid-cols-12 py-2.5 text-[12px] font-bold text-[#4B5F7A] uppercase font-mono">
                                            <div className="col-span-4">Slot Waktu</div>
                                            <div className="col-span-5">Form Pengamatan</div>
                                            <div className="col-span-3 text-right">Status</div>
                                        </div>
                                        <div className="grid grid-cols-12 py-3 items-center">
                                            <div className="col-span-4 font-mono font-medium text-[#102B4E]">07.00 WIB</div>
                                            <div className="col-span-5 text-[#2B3F5C]">Jam Penuh + Foto</div>
                                            <div className="col-span-3 text-right">
                                                <span className="inline-block bg-[#E3F6EC] text-[#14794B] text-[12px] font-bold px-2.5 py-0.5 rounded-full">
                                                    Valid
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 py-3 items-center">
                                            <div className="col-span-4 font-mono font-medium text-[#102B4E]">07.30 WIB</div>
                                            <div className="col-span-5 text-[#2B3F5C]">AGM 1-B (Kartu 1-7)</div>
                                            <div className="col-span-3 text-right">
                                                <span className="inline-block bg-[#FFF3D6] text-[#8A5A00] text-[12px] font-bold px-2.5 py-0.5 rounded-full">
                                                    Pending
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 py-3 items-center">
                                            <div className="col-span-4 font-mono font-medium text-[#102B4E]">13.30 WIB</div>
                                            <div className="col-span-5 text-[#2B3F5C]">AGM 1-B (Kartu 1-7)</div>
                                            <div className="col-span-3 text-right">
                                                <span className="inline-block bg-[#FDE7E7] text-[#B42318] text-[12px] font-bold px-2.5 py-0.5 rounded-full">
                                                    Revisi
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 py-3 items-center">
                                            <div className="col-span-4 font-mono font-medium text-[#102B4E]">17.00 WIB</div>
                                            <div className="col-span-5 text-[#2B3F5C]">Jam Penuh + Foto</div>
                                            <div className="col-span-3 text-right">
                                                <span className="inline-block bg-[#E3F6EC] text-[#14794B] text-[12px] font-bold px-2.5 py-0.5 rounded-full">
                                                    Valid
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Floating Physics Guard Badge */}
                                    <div className="absolute -bottom-5 left-6 bg-white border border-[#D3E6F4] rounded-xl px-4 py-3 shadow-md flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-[13px] text-[#102B4E]">Validasi Fisika Lolos</div>
                                            <div className="text-[11px] font-mono text-[#4B5F7A]">T_basah ≤ T_kering & T_min ≤ T_max</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right Feature List */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="lg:col-span-6 space-y-6 pt-6 lg:pt-0"
                            >
                                <div className="space-y-2">
                                    <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                        FITUR OPERASIONAL
                                    </span>
                                    <h2 className="text-[32px] sm:text-[40px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                        Lebih Mudah, Lebih Terstruktur
                                    </h2>
                                    <p className="text-[16px] text-[#4B5F7A] leading-relaxed pt-1">
                                        Dari input observasi lapangan hingga dokumentasi ber-watermark cloud, seluruh alur dirancang agar data tercatat secara tertib, presisi, dan dapat dipertanggungjawabkan.
                                    </p>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-6 h-6 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0 mt-1">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-[17px] font-bold text-[#102B4E]">Input observasi adaptif (19 slot waktu)</h4>
                                            <p className="text-[14px] text-[#4B5F7A] leading-relaxed mt-0.5">
                                                Form dinamis mengikuti slot waktu berjalan dan alat yang aktif. Nilai bacaan sebelumnya (counter anemometer, tinggi air hook gauge, skala Piche) otomatis terisi dari observasi sebelumnya.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3.5">
                                        <div className="w-6 h-6 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0 mt-1">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-[17px] font-bold text-[#102B4E]">Validasi fisika otomatis (Physics Guard)</h4>
                                            <p className="text-[14px] text-[#4B5F7A] leading-relaxed mt-0.5">
                                                Pemeriksaan kaidah termodinamika instan: Suhu Bola Basah ≤ Bola Kering pada sangkar dan 7 tingkat ketinggian Assman, serta Tmin ≤ Tmax air evaporimeter sebelum data disimpan.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3.5">
                                        <div className="w-6 h-6 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0 mt-1">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-[17px] font-bold text-[#102B4E]">Dokumentasi foto dengan watermark cloud</h4>
                                            <p className="text-[14px] text-[#4B5F7A] leading-relaxed mt-0.5">
                                                Pengambilan foto diwajibkan tepat 2 kali sehari (pukul 07.00 dan 17.00 WIB). Watermark lokasi dan stempel waktu WIB & UTC dibakar permanen ke gambar lalu disimpan ke Google Drive instansi.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3.5">
                                        <div className="w-6 h-6 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0 mt-1">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-[17px] font-bold text-[#102B4E]">Rekap & pelaporan kinerja terpadu</h4>
                                            <p className="text-[14px] text-[#4B5F7A] leading-relaxed mt-0.5">
                                                Penerbitan otomatis berkas bukti dukung SKP triwulan, lembar observasi per jam, ringkasan laporan cuaca per shift, serta pengarsipan data yang tertib dan akuntabel.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* --- ALUR KERJA: DARI PENGAMATAN HINGGA SKP --- */}
                <section id="alur" className="py-20 bg-white">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="lg:col-span-4 space-y-2 pr-0 lg:pr-6"
                            >
                                <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                    ALUR KERJA
                                </span>
                                <h2 className="text-[32px] sm:text-[40px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                    Dari Pengamatan hingga SKP
                                </h2>
                                <p className="text-[15px] text-[#4B5F7A] leading-relaxed pt-1">
                                    Proses operasional yang jelas, terukur, dan terintegrasi, mulai dari pencatatan data di lapangan hingga pengesahan berkas kinerja triwulan pegawai.
                                </p>
                            </motion.div>

                            {/* 4 Steps Timeline */}
                            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
                                {/* Connecting horizontal line for desktop */}
                                <div className="hidden sm:block absolute top-6 left-6 right-6 h-[2px] bg-[#D3E6F4] -z-0" />

                                {/* Step 01 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="relative z-10 space-y-3"
                                >
                                    <div className="w-12 h-12 rounded-full border-2 border-[#168BC5] bg-white text-[#102B4E] font-bold text-[16px] flex items-center justify-center shadow-xs">
                                        01
                                    </div>
                                    <h3 className="text-[18px] font-bold text-[#102B4E]">Pengamatan</h3>
                                    <p className="text-[13px] text-[#4B5F7A] leading-relaxed">
                                        Input pembacaan 19 slot waktu dan lampirkan foto di jam 07.00 & 17.00 WIB.
                                    </p>
                                </motion.div>

                                {/* Step 02 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="relative z-10 space-y-3"
                                >
                                    <div className="w-12 h-12 rounded-full border-2 border-[#168BC5] bg-white text-[#102B4E] font-bold text-[16px] flex items-center justify-center shadow-xs">
                                        02
                                    </div>
                                    <h3 className="text-[18px] font-bold text-[#102B4E]">Validasi</h3>
                                    <p className="text-[13px] text-[#4B5F7A] leading-relaxed">
                                        Pemeriksaan kaidah fisika cuaca (TBB ≤ TBK) dan kelengkapan data real-time.
                                    </p>
                                </motion.div>

                                {/* Step 03 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="relative z-10 space-y-3"
                                >
                                    <div className="w-12 h-12 rounded-full border-2 border-[#168BC5] bg-white text-[#102B4E] font-bold text-[16px] flex items-center justify-center shadow-xs">
                                        03
                                    </div>
                                    <h3 className="text-[18px] font-bold text-[#102B4E]">Verifikasi</h3>
                                    <p className="text-[13px] text-[#4B5F7A] leading-relaxed">
                                        Penyelia meninjau antrean dan memberikan catatan revisi jika terdapat anomali.
                                    </p>
                                </motion.div>

                                {/* Step 04 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                    className="relative z-10 space-y-3"
                                >
                                    <div className="w-12 h-12 rounded-full border-2 border-[#168BC5] bg-white text-[#102B4E] font-bold text-[16px] flex items-center justify-center shadow-xs">
                                        04
                                    </div>
                                    <h3 className="text-[18px] font-bold text-[#102B4E]">Pengesahan</h3>
                                    <p className="text-[13px] text-[#4B5F7A] leading-relaxed">
                                        Data disahkan per triwulan dan berkas bukti dukung SKP diterbitkan otomatis.
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- HASIL PELAPORAN: DOKUMEN SIAP DIGUNAKAN --- */}
                <section className="py-20 bg-[#EAF6FF]/30 border-t border-[#D3E6F4]">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
                            {/* Left Document Graphic / Mockup Preview */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="lg:col-span-6 flex flex-col items-center justify-center"
                            >
                                <div className="relative w-full max-w-[560px] group transition-transform duration-500 hover:scale-[1.02]">
                                    <img
                                        src="/images/report_docs.png?v=no_dash"
                                        alt="Mockup Berkas Laporan Observasi dan SKP BMKG"
                                        className="w-full h-auto object-contain"
                                    />
                                </div>
                                <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#D3E6F4] shadow-xs">
                                    <span className="w-2 h-2 rounded-full bg-[#168BC5] animate-pulse" />
                                    <span className="text-[11px] font-mono font-bold text-[#102B4E] uppercase tracking-wider">
                                        Cover SKP Triwulan • Lampiran Shift Pagi • Lampiran Shift Siang
                                    </span>
                                </div>
                            </motion.div>

                            {/* Right Description */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="lg:col-span-6 space-y-6"
                            >
                                <div className="space-y-2">
                                    <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                        HASIL PELAPORAN
                                    </span>
                                    <h2 className="text-[32px] sm:text-[40px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                        Berkas Laporan Siap Digunakan
                                    </h2>
                                    <p className="text-[16px] text-[#4B5F7A] leading-relaxed pt-1">
                                        Laporan dan bukti dukung kinerja tersedia sesuai kebutuhan, memenuhi standar tata kelola data BMKG serta administrasi kepegawaian nasional.
                                    </p>
                                </div>

                                <ul className="space-y-3.5 text-[15px] text-[#2B3F5C]">
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span><strong>Berkas SKP triwulan:</strong> Format resmi lembar cover pengesahan serta rekap operasional shift pagi dan shift siang yang dilengkapi foto dokumentasi lapangan.</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span><strong>Lembar observasi per jam:</strong> Cetak rekap pengamatan cuaca terstruktur per slot jam pengamatan harian.</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span><strong>Ringkasan laporan cuaca per shift:</strong> Visualisasi parameter cuaca harian untuk kemudahan koordinasi tim operasional stasiun.</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span><strong>Rekapitulasi data terstruktur:</strong> Integrasi pencatatan data yang tertib, siap verifikasi penyelia dan evaluasi kinerja berkala.</span>
                                    </li>
                                </ul>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* --- AKSES & PERAN PENGGUNA --- */}
                <section className="py-20 bg-[#EAF6FF] border-y border-[#D3E6F4]">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="lg:col-span-4 space-y-2 pr-0 lg:pr-6"
                            >
                                <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                    AKSES & PERAN PENGGUNA
                                </span>
                                <h2 className="text-[32px] sm:text-[40px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                    Tiga Peran, Satu Sistem
                                </h2>
                                <p className="text-[15px] text-[#4B5F7A] leading-relaxed pt-1">
                                    Setiap pengguna memiliki hak akses dan alur kerja yang terisolasi sesuai tanggung jawab operasional di Stasiun Klimatologi Jawa Tengah.
                                </p>
                            </motion.div>

                            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {/* Pengamat */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="bg-white rounded-2xl p-6 border border-[#D3E6F4] shadow-xs flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center text-[#168BC5] mb-5">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-[19px] font-bold text-[#102B4E] mb-2">Pengamat</h3>
                                        <p className="text-[14px] text-[#4B5F7A] leading-relaxed">
                                            Mencatat data 19 slot waktu harian (shift pagi & siang), mengunggah foto kegiatan tepat 2x sehari, dan mengoreksi data revisi.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-[#D3E6F4]/60 text-[12px] font-mono text-[#0F6C9E] font-medium">
                                        6 Pengamat Operasional
                                    </div>
                                </motion.div>

                                {/* Penyelia */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="bg-white rounded-2xl p-6 border border-[#D3E6F4] shadow-xs flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center text-[#168BC5] mb-5">
                                            <Award className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-[19px] font-bold text-[#102B4E] mb-2">Penyelia</h3>
                                        <p className="text-[14px] text-[#4B5F7A] leading-relaxed">
                                            Memverifikasi antrean data observasi harian, memberikan catatan revisi, dan mengesahkan berkas SKP triwulan pegawai.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-[#D3E6F4]/60 text-[12px] font-mono text-[#0F6C9E] font-medium">
                                        Penyelia Stasiun
                                    </div>
                                </motion.div>

                                {/* Administrator */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="bg-white rounded-2xl p-6 border border-[#D3E6F4] shadow-xs flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center text-[#168BC5] mb-5">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-[19px] font-bold text-[#102B4E] mb-2">Administrator</h3>
                                        <p className="text-[14px] text-[#4B5F7A] leading-relaxed">
                                            Mengelola akun pengguna, mereset password, menegakkan Force Change Password, serta mengonfigurasi instrumen & parameter.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-[#D3E6F4]/60 text-[12px] font-mono text-[#0F6C9E] font-medium">
                                        Admin Sistem
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- FAQ SECTION --- */}
                <section id="faq" className="py-20 bg-white">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="lg:col-span-4 space-y-2 pr-0 lg:pr-6"
                            >
                                <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                    FAQ
                                </span>
                                <h2 className="text-[32px] sm:text-[40px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                    Pertanyaan Umum
                                </h2>
                                <p className="text-[15px] text-[#4B5F7A] leading-relaxed pt-1">
                                    Temukan jawaban seputar operasional, validasi data fisika, kebijakan foto watermark, dan pengesahan SKP di SILAP-Kinerja.
                                </p>
                            </motion.div>

                            {/* Accordion List */}
                            <div className="lg:col-span-8 divide-y divide-[#D3E6F4] border-t border-b border-[#D3E6F4]">
                                {FAQ_ITEMS.map((faq, index) => {
                                    const isOpen = openFaqIndex === index;
                                    return (
                                        <div key={index} className="py-4 sm:py-5">
                                            <button
                                                onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                                                className="w-full flex items-center justify-between text-left gap-4 group"
                                            >
                                                <span className={`text-[16px] sm:text-[17px] font-semibold transition-colors duration-200 ${
                                                    isOpen ? 'text-[#0F6C9E]' : 'text-[#102B4E] group-hover:text-[#168BC5]'
                                                }`}>
                                                    {faq.q}
                                                </span>
                                                <span className="text-[#168BC5] text-[20px] font-bold shrink-0 transition-transform duration-200">
                                                    {isOpen ? '-' : '+'}
                                                </span>
                                            </button>
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className="pt-3 text-[15px] text-[#4B5F7A] leading-relaxed">
                                                            {faq.a}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- LOKASI STASIUN --- */}
                <section id="lokasi" className="py-20 bg-[#EAF6FF] border-t border-[#D3E6F4]">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
                            {/* Left Contact & Address */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="lg:col-span-5 space-y-6"
                            >
                                <div className="space-y-2">
                                    <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                        LOKASI STASIUN
                                    </span>
                                    <h2 className="text-[32px] sm:text-[40px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                        Stasiun Klimatologi Jawa Tengah
                                    </h2>
                                    <p className="text-[15px] text-[#4B5F7A] leading-relaxed pt-1">
                                        Pusat pengamatan data iklim resmi BMKG di wilayah Jawa Tengah dengan fasilitas taman alat lengkap dan AWS digital.
                                    </p>
                                </div>

                                <ul className="space-y-4 pt-2 text-[15px] text-[#2B3F5C]">
                                    <li className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-[#168BC5] shrink-0 mt-0.5" />
                                        <span>Jl. Siliwangi No. 291, Semarang Barat, Kota Semarang 50145</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-[#168BC5] shrink-0" />
                                        <span>(024) 7607750</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-[#168BC5] shrink-0" />
                                        <span>staklim.semarang@bmkg.go.id</span>
                                    </li>
                                </ul>
                            </motion.div>

                            {/* Right Map Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="lg:col-span-7"
                            >
                                <div className="relative rounded-2xl overflow-hidden border border-[#D3E6F4] shadow-sm bg-slate-100 h-[380px] sm:h-[420px]">
                                    {/* Google Maps Top-Left Info Card with BMKG Identity */}
                                    <div className="absolute top-3 left-3 z-20 max-w-[340px] bg-white/95 rounded-xl shadow-lg border border-slate-200/90 p-3.5 sm:p-4 backdrop-blur-md">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-[11px] font-semibold text-[#168BC5] mb-1">
                                                    <span>BMKG Jawa Tengah</span>
                                                </div>
                                                <h4 className="text-[14px] font-bold text-[#102B4E] leading-snug">
                                                    Stasiun Klimatologi Jawa Tengah
                                                </h4>
                                                <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                                                    Jl. Siliwangi No. 291, Kalibanteng Kulon, Kec. Semarang Barat, Kota Semarang, Jawa Tengah 50145
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-2 text-[12px] text-slate-600">
                                                    <span className="font-bold text-amber-500">4.8</span>
                                                    <div className="flex text-amber-400 text-[11px]">
                                                        {'★'.repeat(5)}
                                                    </div>
                                                    <span className="text-slate-400 text-[11px]">(Kantor &amp; Taman Alat)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
                                            <a
                                                href="https://www.google.com/maps/search/?api=1&query=Stasiun+Klimatologi+Jawa+Tengah+Jl.+Siliwangi+291+Semarang"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#168BC5] text-white text-[12px] font-bold hover:bg-[#0F6C9E] transition-colors shadow-2xs"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Open in Maps</span>
                                            </a>
                                            <a
                                                href="https://www.google.com/maps/dir/?api=1&destination=Stasiun+Klimatologi+Jawa+Tengah+Jl.+Siliwangi+291+Semarang"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-[#102B4E] hover:bg-slate-200 text-[12px] font-semibold transition-colors"
                                                title="Petunjuk Arah"
                                            >
                                                <Navigation className="w-3.5 h-3.5 text-[#168BC5]" />
                                                <span>Rute</span>
                                            </a>
                                        </div>
                                    </div>

                                    {/* Real-time Interactive Google Maps Iframe */}
                                    <iframe
                                        title="Lokasi BMKG Stasiun Klimatologi Jawa Tengah"
                                        src="https://maps.google.com/maps?q=Stasiun+Klimatologi+Klas+I+Semarang+BMKG,+Jl.+Siliwangi+No.+291,+Semarang&t=&z=16&ie=UTF8&iwloc=&output=embed"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className="w-full h-full"
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>

            {/* --- FOOTER: DARK BLUE (COMPACT) --- */}
            <footer className="bg-[#102B4E] text-[#C5D6EA] py-3.5 sm:py-4 border-t border-[#102B4E]">
                <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
                        {/* Footer Kiri: Logo & Nama Institusi */}
                        <div className="flex items-center gap-2.5">
                            <img
                                src="/images/logo.png"
                                alt="Logo BMKG"
                                className="h-8 sm:h-9 w-auto object-contain brightness-110"
                            />
                            <div>
                                <span className="block font-bold text-[16px] text-white leading-tight">
                                    SILAP-Kinerja
                                </span>
                                <span className="text-[11.5px] font-medium text-[#8FD0F2] leading-tight block">
                                    Stasiun Klimatologi Jawa Tengah
                                </span>
                            </div>
                        </div>

                        {/* Footer Kanan: Hak Cipta */}
                        <div className="text-[12.5px] sm:text-[13px] text-[#A2BEDD] text-center sm:text-right font-medium">
                            © 2026. Hak Cipta Dilindungi.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
