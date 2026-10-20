import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Radio,
    ShieldCheck,
    FileText,
    ArrowRight,
    CheckCircle2,
    Menu,
    X,
    MapPin,
    Phone,
    Mail,
    Users,
    Award,
    Building2,
    Clock,
    Camera
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig, useScroll, useSpring } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

// Reveal saat masuk viewport: geser + blur + fade, easing panjang agar terasa mulus.
const reveal = (delay = 0, from = { y: 48 }) => ({
    initial: { opacity: 0, filter: 'blur(8px)', ...from },
    whileInView: { opacity: 1, filter: 'blur(0px)', x: 0, y: 0, scale: 1 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.85, delay, ease: EASE },
});

// Hero: kontainer men-stagger anak-anaknya.
const heroContainer = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } } };
const heroItem = {
    hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.85, ease: EASE } },
};

// Navigation items matching design & user specifications
const NAV_ITEMS = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'instrumen', label: 'Instrumen' },
    { id: 'fitur', label: 'Fitur' },
    { id: 'alur', label: 'Alur Kerja' },
    { id: 'faq', label: 'FAQ' },
    { id: 'lokasi', label: 'Lokasi' },
];

// Tinggi offset navbar saat scroll
const NAV_OFFSET = 80;

export default function Landing() {
    const { auth } = usePage().props || {};
    const user = auth?.user;

    const { scrollYProgress } = useScroll();
    const progressX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
    const [scrolled, setScrolled] = useState(false);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('beranda');
    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    // Selama scroll hasil klik menu berjalan, scroll spy dikunci supaya indikator
    // langsung menuju tujuan dan tidak melompat melewati section di antaranya.
    const navLock = useRef({ active: false, timer: null });
    const unlockNav = () => {
        clearTimeout(navLock.current.timer);
        navLock.current.active = false;
    };

    const scrollToSection = (e, id) => {
        if (e) e.preventDefault();
        setMobileMenuOpen(false);

        const element = document.getElementById(id);
        if (!element) return;

        navLock.current.active = true;
        clearTimeout(navLock.current.timer);
        navLock.current.timer = setTimeout(unlockNav, 1400);

        const navHeight = window.innerWidth < 640 ? 74 : NAV_OFFSET;
        const elementTop = element.getBoundingClientRect().top + window.scrollY;
        const targetY = Math.max(0, elementTop - navHeight);

        window.scrollTo({
            top: targetY,
            behavior: 'smooth',
        });
        setActiveSection(id);
    };

    // Scroll spy: section aktif = yang terakhir melewati garis di bawah navbar.
    useEffect(() => {
        let frame = 0;

        const update = () => {
            frame = 0;
            setScrolled(window.scrollY > 12);
            if (navLock.current.active) return;

            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 32;
            let current = NAV_ITEMS[0].id;
            const navHeight = window.innerWidth < 640 ? 74 : NAV_OFFSET;
            for (const { id } of NAV_ITEMS) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= navHeight + 48) current = id;
            }
            setActiveSection(atBottom ? NAV_ITEMS[NAV_ITEMS.length - 1].id : current);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        const onUserScroll = () => unlockNav(); // pengguna mengambil alih scroll

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('scrollend', unlockNav);
        window.addEventListener('wheel', onUserScroll, { passive: true });
        window.addEventListener('touchstart', onUserScroll, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(navLock.current.timer);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('scrollend', unlockNav);
            window.removeEventListener('wheel', onUserScroll);
            window.removeEventListener('touchstart', onUserScroll);
        };
    }, []);

    const FAQ_ITEMS = [
        {
            q: "Bagaimana cara memperoleh akun?",
            a: "Akun dibuat oleh Administrator stasiun. SILAP-Kinerja adalah sistem internal dan tidak menyediakan pendaftaran mandiri. Login memakai NIP atau email."
        },
        {
            q: "Apa yang terjadi ketika data pengamatan perlu direvisi?",
            a: "Penyelia mengembalikan observasi berstatus Revisi beserta catatannya. Pengamat memperbaiki lalu menyimpan ulang. Selama masih ada entri Revisi, triwulan tidak bisa di-ACC. Setelah di-ACC data terkunci; hanya admin yang dapat membukanya, dengan alasan tercatat."
        },
        {
            q: "Kapan foto bukti observasi wajib dilampirkan?",
            a: "Hanya 2 kali sehari: pukul 07.00 WIB (shift pagi) dan 17.00 WIB (shift siang). Foto diambil langsung lewat kamera aplikasi dengan geotag otomatis (lokasi, koordinat, tanggal dan jam), lalu disimpan ke Google Drive instansi. Unggah dari galeri hanya untuk keadaan darurat dan ditandai untuk penyelia."
        },
        {
            q: "Bagaimana berkas bukti dukung SKP triwulan dapat diunduh?",
            a: "Laporan triwulan berupa PDF per pegawai, tersedia setelah triwulan di-ACC penyelia. Pengamat mengunduh laporan miliknya; penyelia dan admin dapat mengunduh PDF tiap pegawai atau ZIP semua pegawai."
        },
        {
            q: "Lupa kata sandi akun, harus bagaimana?",
            a: "Hubungi Administrator stasiun untuk mereset kata sandi. Setelah reset, Anda diminta membuat kata sandi baru saat login berikutnya."
        }
    ];

    return (
        <MotionConfig reducedMotion="user">
        <div className="min-h-screen bg-white text-[#2B3F5C] font-sans antialiased selection:bg-[#168BC5] selection:text-white overflow-x-clip">
            <Head title="SILAP-Kinerja | Stasiun Klimatologi Jawa Tengah" />

            {/* --- NAVBAR --- */}
            <motion.header
                initial={{ y: -90, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, ease: EASE }}
                className={`fixed top-0 inset-x-0 z-50 w-full backdrop-blur-md border-b border-[#D3E6F4] transition-all duration-300 ease-out ${
                    scrolled ? 'bg-white/95 shadow-md shadow-[#102B4E]/8' : 'bg-white/95'
                }`}
            >
                <motion.div
                    style={{ scaleX: progressX }}
                    className="absolute bottom-0 left-0 right-0 h-[3px] origin-left bg-gradient-to-r from-[#102B4E] via-[#168BC5] to-[#8FD0F2]"
                />
                <div className={`max-w-[1240px] mx-auto px-3.5 sm:px-6 lg:px-8 flex items-center justify-between transition-[height] duration-300 ease-out ${
                    scrolled ? 'h-[58px] sm:h-[62px]' : 'h-[66px] sm:h-[72px]'
                }`}>
                    {/* Brand Identity */}
                    <a
                        href="#beranda"
                        onClick={(e) => scrollToSection(e, 'beranda')}
                        className="flex items-center gap-2.5 sm:gap-3 group min-w-0"
                    >
                        <img
                            src="/images/brand/logo-hitam.webp"
                            alt="Logo BMKG"
                            className="h-8 sm:h-10 w-auto shrink-0 object-contain transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-[15px] sm:text-[17px] text-[#102B4E] leading-tight tracking-tight">
                                SILAP-Kinerja
                            </span>
                            <span className="text-[10px] sm:text-[12px] font-semibold text-[#168BC5] leading-tight truncate">
                                Stasiun Klimatologi Jawa Tengah
                            </span>
                        </div>
                    </a>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-5 xl:gap-7 relative">
                        {NAV_ITEMS.map((item, i) => {
                            const isActive = activeSection === item.id;
                            return (
                                <motion.a
                                    initial={{ opacity: 0, y: -14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.35 + i * 0.08, ease: EASE }}
                                    whileHover={{ y: -2 }}
                                    key={item.id}
                                    href={`#${item.id}`}
                                    onClick={(e) => scrollToSection(e, item.id)}
                                    className={`relative py-1.5 text-[15px] font-semibold transition-colors duration-300 ease-out ${
                                        isActive ? 'text-[#0F6C9E]' : 'text-[#2B3F5C] hover:text-[#168BC5]'
                                    }`}
                                >
                                    {item.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNavIndicator"
                                            className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#168BC5] rounded-full"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 220,
                                                damping: 28,
                                                mass: 0.9
                                            }}
                                        />
                                    )}
                                </motion.a>
                            );
                        })}
                    </nav>

                    {/* Right Login / Dashboard CTA */}
                    <div className="hidden lg:flex items-center gap-4">
                        {user ? (
                            <Link
                                href="/dashboard"
                                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#102B4E] via-[#0E5284] to-[#168BC5] text-white text-[14px] font-bold shadow-sm shadow-[#102B4E]/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:from-[#0B213D] hover:via-[#105F99] hover:to-[#1A9BE0] hover:shadow-md hover:shadow-[#168BC5]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                            >
                                <span>Buka Dashboard</span>
                                <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#102B4E] via-[#0E5284] to-[#168BC5] text-white text-[14px] font-bold shadow-sm shadow-[#102B4E]/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:from-[#0B213D] hover:via-[#105F99] hover:to-[#1A9BE0] hover:shadow-md hover:shadow-[#168BC5]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                            >
                                <span>Login</span>
                                <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
                            </Link>
                        )}
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden shrink-0 p-2 rounded-xl text-[#102B4E] hover:bg-[#EAF6FF] active:scale-95 border border-[#D3E6F4] transition-all duration-200 ease-out"
                        aria-label="Buka menu navigasi"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5 transition-transform duration-200" /> : <Menu className="w-5 h-5 transition-transform duration-200" />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{
                                height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                                opacity: { duration: 0.2, ease: 'easeInOut' }
                            }}
                            className="lg:hidden overflow-y-auto max-h-[calc(100dvh-66px)] border-t border-[#D3E6F4] bg-white/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-2 shadow-xl"
                        >
                            {NAV_ITEMS.map((item, i) => (
                                <motion.a
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.35, delay: 0.05 + i * 0.04, ease: EASE }}
                                    key={item.id}
                                    href={`#${item.id}`}
                                    onClick={(e) => scrollToSection(e, item.id)}
                                    className={`block px-3.5 py-2.5 rounded-xl text-[15px] font-semibold transition-all duration-200 ease-out active:scale-[0.99] ${
                                        activeSection === item.id ? 'bg-[#EAF6FF] text-[#0F6C9E] font-bold' : 'text-[#2B3F5C] hover:bg-[#EAF6FF]'
                                    }`}
                                >
                                    {item.label}
                                </motion.a>
                            ))}
                            <div className="pt-2">
                                <Link
                                    href={user ? "/dashboard" : "/login"}
                                    className="block w-full text-center py-3 rounded-full bg-gradient-to-r from-[#102B4E] via-[#0E5284] to-[#168BC5] text-white font-bold text-[14px] shadow-sm shadow-[#102B4E]/20 transition-all duration-300 hover:shadow-md active:scale-[0.98]"
                                >
                                    {user ? "Buka Dashboard" : "Login Pegawai"}
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            <div aria-hidden="true" className="h-[66px] sm:h-[72px]" />
            <main>
                {/* --- HERO SECTION --- */}
                <section id="beranda" className="pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-16 lg:pb-20 overflow-hidden bg-white scroll-mt-20 sm:scroll-mt-24">
                    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-8 items-center">
                            {/* Left Content Column */}
                            <motion.div
                                variants={heroContainer}
                                initial="hidden"
                                animate="show"
                                className="lg:col-span-5 xl:col-span-5 space-y-5 sm:space-y-6 z-10"
                            >
                                {/* Main Headline: Clean block spans to prevent mobile clumping */}
                                <motion.h1
                                    variants={heroItem}
                                    className="text-[26px] min-[360px]:text-[28px] min-[400px]:text-[32px] sm:text-[38px] lg:text-[40px] xl:text-[44px] font-extrabold text-[#102B4E] tracking-tight leading-[1.18] sm:leading-[1.12]"
                                >
                                    <span className="block">Pengamatan Cuaca</span>
                                    <span className="block">Terverifikasi,</span>
                                    <span className="block">Pelaporan Lebih Mudah.</span>
                                </motion.h1>

                                {/* Description Text */}
                                <motion.p variants={heroItem} className="text-[#4B5F7A] text-[14px] sm:text-[16px] leading-relaxed max-w-lg">
                                    SILAP-Kinerja mengintegrasikan pencatatan pengamatan cuaca multi-alat, validasi data meteorologi, dokumentasi lapangan, dan penyusunan bukti dukung SKP dalam satu sistem.
                                </motion.p>

                                {/* Action Buttons: Responsive full-width on mobile */}
                                <motion.div variants={heroItem} className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
                                    <Link
                                        href={user ? "/dashboard" : "/login"}
                                        className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#102B4E] via-[#0E5284] to-[#168BC5] text-white text-[14px] sm:text-[15px] font-bold shadow-md shadow-[#102B4E]/25 transition-all duration-300 hover:from-[#0B213D] hover:via-[#105F99] hover:to-[#1A9BE0] hover:shadow-xl hover:shadow-[#168BC5]/30 hover:-translate-y-0.5 active:translate-y-0 text-center"
                                    >
                                        <span>{user ? "Masuk Dashboard" : "Masuk Akun Pegawai"}</span>
                                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                                    </Link>
                                    <a
                                        href="#fitur"
                                        onClick={(e) => scrollToSection(e, 'fitur')}
                                        className="inline-flex items-center justify-center gap-2 text-[14px] sm:text-[15px] font-semibold text-[#0284C7] hover:text-[#0369A1] transition-colors py-2 sm:py-0"
                                    >
                                        <span>Pelajari Lebih Lanjut</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </a>
                                </motion.div>
                            </motion.div>

                            {/* Right Visual Column: Enlarged Equipment Image */}
                            <motion.div
                                initial={{ opacity: 0, x: 40, scale: 0.95, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                                transition={{ duration: 1.1, delay: 0.25, ease: EASE }}
                                className="lg:col-span-7 xl:col-span-7 relative flex items-center justify-center lg:justify-end mt-4 lg:mt-0"
                            >
                                <div className="relative w-full max-w-[340px] min-[400px]:max-w-[420px] sm:max-w-[580px] lg:max-w-[820px] lg:scale-105 xl:scale-110 origin-center lg:origin-right transition-transform duration-500">
                                    <motion.img
                                        src="/images/landing/hero-instruments.png?v=hero_v9_aws"
                                        alt="Instrumen Pengamatan Cuaca Otomatis AWS dan Sensor Meteorologi BMKG"
                                        className="w-full h-auto object-contain select-none"
                                        draggable="false"
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* --- NILAI UTAMA: TIGA PILAR, SATU TUJUAN --- */}
                <section className="py-12 sm:py-16 lg:py-20 bg-[#EAF6FF] border-y border-[#D3E6F4]">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Left Pillar Title */}
                            <motion.div
                                {...reveal(0, { y: 48 })}
                                className="lg:col-span-4 space-y-2 pr-0 lg:pr-6"
                            >
                                <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                    NILAI UTAMA
                                </span>
                                <h2 className="text-[24px] min-[360px]:text-[26px] sm:text-[34px] lg:text-[36px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                    Tiga Pilar, Satu Tujuan.
                                </h2>
                                <p className="text-[14px] sm:text-[15px] text-[#4B5F7A] leading-relaxed pt-1 sm:pt-2">
                                    Mendukung proses pengamatan cuaca yang akurat, terdokumentasi dengan baik, dan terhubung langsung dengan penyusunan SKP pegawai Stasiun Klimatologi Jawa Tengah.
                                </p>
                            </motion.div>

                            {/* Three Pillars Cards */}
                            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                {/* Pillar 1 */}
                                <motion.div
                                    {...reveal(0.1, { y: 48 })}
                                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                    className="bg-white rounded-2xl p-5 sm:p-6 border border-[#D3E6F4] shadow-xs hover:border-[#168BC5]/40 transition-colors"
                                >
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center text-[#168BC5] mb-4 sm:mb-5">
                                        <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102B4E] mb-2">Pengamatan</h3>
                                    <p className="text-[13.5px] sm:text-[14px] text-[#4B5F7A] leading-relaxed">
                                        Pencatatan 19 slot harian (16 jam penuh + 3 slot AGM 1-B), memadukan nilai AWS dan pembacaan alat konvensional taman alat.
                                    </p>
                                </motion.div>

                                {/* Pillar 2 */}
                                <motion.div
                                    {...reveal(0.2, { y: 48 })}
                                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                    className="bg-white rounded-2xl p-5 sm:p-6 border border-[#D3E6F4] shadow-xs hover:border-[#168BC5]/40 transition-colors"
                                >
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center text-[#168BC5] mb-4 sm:mb-5">
                                        <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102B4E] mb-2">Validasi</h3>
                                    <p className="text-[13.5px] sm:text-[14px] text-[#4B5F7A] leading-relaxed">
                                        Pemeriksaan kaidah fisika saat input (TBB ≤ TBK, batas wajar nilai) serta ACC per triwulan oleh penyelia stasiun.
                                    </p>
                                </motion.div>

                                {/* Pillar 3 */}
                                <motion.div
                                    {...reveal(0.3, { y: 48 })}
                                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                    className="bg-white rounded-2xl p-5 sm:p-6 border border-[#D3E6F4] shadow-xs hover:border-[#168BC5]/40 transition-colors"
                                >
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center text-[#168BC5] mb-4 sm:mb-5">
                                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102B4E] mb-2">Pelaporan</h3>
                                    <p className="text-[13.5px] sm:text-[14px] text-[#4B5F7A] leading-relaxed">
                                        Lembar bantu input per slot, foto ber-geotag di Google Drive, hingga PDF laporan triwulan sebagai bukti dukung SKP.
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- INSTRUMEN PENGAMATAN --- */}
                <section id="instrumen" className="py-12 sm:py-16 lg:py-20 bg-white scroll-mt-20 sm:scroll-mt-24">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Section Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
                            <motion.div
                                {...reveal(0, { y: 48 })}
                                className="space-y-2 max-w-xl"
                            >
                                <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                    INSTRUMEN PENGAMATAN
                                </span>
                                <h2 className="text-[24px] min-[360px]:text-[26px] sm:text-[34px] lg:text-[38px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                    Terintegrasi dalam Satu Sistem
                                </h2>
                            </motion.div>
                            <motion.p
                                {...reveal(0.1, { y: 48 })}
                                className="text-[14px] sm:text-[15px] text-[#4B5F7A] max-w-md leading-relaxed"
                            >
                                Instrumen otomatis, manual, dan observasi visual di Stasiun Klimatologi Jawa Tengah dicatat dalam satu aplikasi.
                            </motion.p>
                        </div>

                        {/* 3 Real Photo Instrument Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
                            {/* Card 1: Otomatis */}
                            <motion.div
                                {...reveal(0, { y: 48 })}
                                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                className="group bg-white rounded-2xl border border-[#D3E6F4] overflow-hidden shadow-xs hover:border-[#168BC5] hover:shadow-md transition-all duration-300 flex flex-col h-full"
                            >
                                <div className="h-44 sm:h-52 w-full overflow-hidden border-b border-[#D3E6F4] relative shrink-0">
                                    <img
                                        src="/images/landing/instrument-aws.png"
                                        alt="Alat Otomatis AWS"
                                        className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102B4E] mb-1">Otomatis (Digital)</h3>
                                        <p className="text-[13px] text-[#4B5F7A] mb-4 leading-normal">
                                            Nilai sensor AWS dibaca dari monitor pada setiap slot pengamatan.
                                        </p>
                                        <div className="space-y-2.5 text-[13px] sm:text-[13.5px] text-[#4B5F7A] leading-relaxed">
                                            <div className="flex items-start gap-2.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong className="text-[#102B4E]">AWS Meteorologi:</strong> Suhu, RH, tekanan QFE/QFF, radiasi &amp; curah hujan.</span>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong className="text-[#102B4E]">Angin AWS:</strong> Arah angin (°) dan kecepatan (m/s &amp; knot).</span>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong className="text-[#102B4E]">Dua Sumber:</strong> Nilai AWS disimpan berdampingan dengan nilai manual.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 2: Manual / Konvensional */}
                            <motion.div
                                {...reveal(0.1, { y: 48 })}
                                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                className="group bg-white rounded-2xl border border-[#D3E6F4] overflow-hidden shadow-xs hover:border-[#168BC5] hover:shadow-md transition-all duration-300 flex flex-col h-full"
                            >
                                <div className="h-44 sm:h-52 w-full overflow-hidden border-b border-[#D3E6F4] relative shrink-0">
                                    <img
                                        src="/images/landing/instrument-manual.png"
                                        alt="Alat Manual Sangkar Meteorologi dan Panci Penguapan"
                                        className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102B4E] mb-1">Manual &amp; Konvensional</h3>
                                        <p className="text-[13px] text-[#4B5F7A] mb-4 leading-normal">
                                            Pengukuran fisik presisi standar sangkar &amp; taman alat stasiun.
                                        </p>
                                        <div className="space-y-2.5 text-[13px] sm:text-[13.5px] text-[#4B5F7A] leading-relaxed">
                                            <div className="flex items-start gap-2.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong className="text-[#102B4E]">Psikrometer:</strong> Termometer TBK &amp; TBB sangkar serta Assman bertingkat 7 level.</span>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong className="text-[#102B4E]">Evaporimeter:</strong> Panci Terbuka Klas A (Hook Gauge) &amp; tabung Piche berskala.</span>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong className="text-[#102B4E]">Taman Alat:</strong> Termometer tanah, Campbell-Stokes, Gunn-Bellani, OBS, microbarograf &amp; termograf.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 3: Visual */}
                            <motion.div
                                {...reveal(0.2, { y: 48 })}
                                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                className="group bg-white rounded-2xl border border-[#D3E6F4] overflow-hidden shadow-xs hover:border-[#168BC5] hover:shadow-md transition-all duration-300 flex flex-col h-full"
                            >
                                <div className="h-44 sm:h-52 w-full overflow-hidden border-b border-[#D3E6F4] relative shrink-0">
                                    <img
                                        src="/images/landing/instrument-visual.png"
                                        alt="Pengamatan Visual Tutupan Awan Langit"
                                        className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102B4E] mb-1">Pengamatan Visual</h3>
                                        <p className="text-[13px] text-[#4B5F7A] mb-4 leading-normal">
                                            Observasi kualitatif keadaan kubah langit &amp; kondisi permukaan.
                                        </p>
                                        <div className="space-y-2.5 text-[13px] sm:text-[13.5px] text-[#4B5F7A] leading-relaxed">
                                            <div className="flex items-start gap-2.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong className="text-[#102B4E]">Jumlah Awan:</strong> Estimasi luas kubah tutupan awan langit (0 s.d. 8 okta).</span>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong className="text-[#102B4E]">Jarak Pandang:</strong> Visibilitas mendatar objek patokan stasiun (km).</span>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#168BC5] mt-2 shrink-0" />
                                                <span><strong className="text-[#102B4E]">Keadaan Lapangan:</strong> Keadaan tanah &amp; keadaan hujan pada slot AGM 1-B.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                    </div>
                </section>

                {/* --- FITUR OPERASIONAL: LEBIH MUDAH, LEBIH TERSTRUKTUR --- */}
                <section id="fitur" className="py-12 sm:py-16 lg:py-20 bg-[#EAF6FF]/40 border-t border-[#D3E6F4] scroll-mt-20 sm:scroll-mt-24">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                            {/* Left Mockup Table (Antrean Validasi & Physics Guard Card) */}
                            <motion.div
                                {...reveal(0, { x: -40 })}
                                className="lg:col-span-6 relative pb-6 sm:pb-4"
                            >
                                <div className="bg-white rounded-2xl border border-[#D3E6F4] p-4 sm:p-6 shadow-sm relative">
                                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#D3E6F4]">
                                        <div>
                                            <h4 className="text-[16px] sm:text-[17px] font-bold text-[#102B4E]">Validasi Data</h4>
                                            <p className="text-[12px] sm:text-[13px] text-[#4B5F7A]">Contoh status entri sebelum ACC triwulan</p>
                                        </div>
                                        <span className="text-[11px] font-mono bg-[#EAF6FF] text-[#168BC5] font-semibold px-2.5 py-1 rounded-md">
                                            CONTOH
                                        </span>
                                    </div>

                                    {/* Table View */}
                                    <div className="divide-y divide-[#D3E6F4] text-[13px] sm:text-[14px]">
                                        <div className="grid grid-cols-12 py-2 text-[11px] sm:text-[12px] font-bold text-[#4B5F7A] uppercase font-mono">
                                            <div className="col-span-4">Slot Waktu</div>
                                            <div className="col-span-5">Form Pengamatan</div>
                                            <div className="col-span-3 text-right">Status</div>
                                        </div>
                                        <div className="grid grid-cols-12 py-2.5 sm:py-3 items-center">
                                            <div className="col-span-4 font-mono font-medium text-[#102B4E]">07.00 WIB</div>
                                            <div className="col-span-5 text-[#2B3F5C] truncate pr-1">Jam Penuh + Foto</div>
                                            <div className="col-span-3 text-right">
                                                <span className="inline-block bg-[#E3F6EC] text-[#14794B] text-[11px] sm:text-[12px] font-bold px-2 py-0.5 rounded-full">
                                                    Tersimpan
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 py-2.5 sm:py-3 items-center">
                                            <div className="col-span-4 font-mono font-medium text-[#102B4E]">07.30 WIB</div>
                                            <div className="col-span-5 text-[#2B3F5C] truncate pr-1">AGM 1-B (Kartu 1-7)</div>
                                            <div className="col-span-3 text-right">
                                                <span className="inline-block bg-[#FFF3D6] text-[#8A5A00] text-[11px] sm:text-[12px] font-bold px-2 py-0.5 rounded-full">
                                                    Tersimpan
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 py-2.5 sm:py-3 items-center">
                                            <div className="col-span-4 font-mono font-medium text-[#102B4E]">13.30 WIB</div>
                                            <div className="col-span-5 text-[#2B3F5C] truncate pr-1">AGM 1-B (Kartu 1-7)</div>
                                            <div className="col-span-3 text-right">
                                                <span className="inline-block bg-[#FDE7E7] text-[#B42318] text-[11px] sm:text-[12px] font-bold px-2 py-0.5 rounded-full">
                                                    Revisi
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 py-2.5 sm:py-3 items-center">
                                            <div className="col-span-4 font-mono font-medium text-[#102B4E]">17.00 WIB</div>
                                            <div className="col-span-5 text-[#2B3F5C] truncate pr-1">Jam Penuh + Foto</div>
                                            <div className="col-span-3 text-right">
                                                <span className="inline-block bg-[#E3F6EC] text-[#14794B] text-[11px] sm:text-[12px] font-bold px-2 py-0.5 rounded-full">
                                                    Tersimpan
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Floating Physics Guard Badge */}
                                    <div className="absolute -bottom-5 left-3 right-3 sm:left-6 sm:right-auto max-w-sm bg-white border border-[#D3E6F4] rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-md flex items-center gap-2.5 sm:gap-3">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-[12px] sm:text-[13px] text-[#102B4E]">Validasi Fisika Lolos</div>
                                            <div className="text-[10px] sm:text-[11px] font-mono text-[#4B5F7A] truncate">T_basah ≤ T_kering &amp; T_min ≤ T_max</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right Feature List */}
                            <motion.div
                                {...reveal(0, { x: 40 })}
                                className="lg:col-span-6 space-y-5 sm:space-y-6 pt-4 lg:pt-0"
                            >
                                <div className="space-y-2">
                                    <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                        FITUR OPERASIONAL
                                    </span>
                                    <h2 className="text-[24px] min-[360px]:text-[26px] sm:text-[34px] lg:text-[38px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                        Lebih Mudah, Lebih Terstruktur
                                    </h2>
                                    <p className="text-[14px] sm:text-[16px] text-[#4B5F7A] leading-relaxed pt-1">
                                        Pencatatan data pengamatan yang rapi, diperiksa otomatis saat input, dan siap dilaporkan.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1 sm:pt-2">
                                    {/* Feature 1 */}
                                    <div className="p-4 rounded-xl bg-white border border-[#D3E6F4] shadow-2xs hover:border-[#168BC5]/50 transition-colors">
                                        <div className="w-9 h-9 rounded-lg bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center mb-3">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-[15px] font-bold text-[#102B4E] leading-snug">
                                            Form Dinamis 19 Slot
                                        </h4>
                                        <p className="text-[13px] text-[#4B5F7A] mt-1 leading-relaxed">
                                            Field mengikuti jadwal baca alat aktif; nilai "Sebelum" terisi otomatis dari bacaan terakhir.
                                        </p>
                                    </div>

                                    {/* Feature 2 */}
                                    <div className="p-4 rounded-xl bg-white border border-[#D3E6F4] shadow-2xs hover:border-[#168BC5]/50 transition-colors">
                                        <div className="w-9 h-9 rounded-lg bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center mb-3">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-[15px] font-bold text-[#102B4E] leading-snug">
                                            Validasi Fisika Real-Time
                                        </h4>
                                        <p className="text-[13px] text-[#4B5F7A] mt-1 leading-relaxed">
                                            TBB ≤ TBK, Min ≤ Maks, dan batas wajar (misal arah angin 0–360°) diperiksa sebelum data tersimpan.
                                        </p>
                                    </div>

                                    {/* Feature 3 */}
                                    <div className="p-4 rounded-xl bg-white border border-[#D3E6F4] shadow-2xs hover:border-[#168BC5]/50 transition-colors">
                                        <div className="w-9 h-9 rounded-lg bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center mb-3">
                                            <Camera className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-[15px] font-bold text-[#102B4E] leading-snug">
                                            Geotag &amp; Cloud Archive
                                        </h4>
                                        <p className="text-[13px] text-[#4B5F7A] mt-1 leading-relaxed">
                                            Foto wajib slot 07.00 &amp; 17.00 WIB ber-geotag, diunggah ke Google Drive dan dicoba ulang otomatis bila gagal.
                                        </p>
                                    </div>

                                    {/* Feature 4 */}
                                    <div className="p-4 rounded-xl bg-white border border-[#D3E6F4] shadow-2xs hover:border-[#168BC5]/50 transition-colors">
                                        <div className="w-9 h-9 rounded-lg bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center mb-3">
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-[15px] font-bold text-[#102B4E] leading-snug">
                                            Laporan Triwulan Otomatis
                                        </h4>
                                        <p className="text-[13px] text-[#4B5F7A] mt-1 leading-relaxed">
                                            PDF bukti dukung SKP per pegawai tersusun otomatis setelah ACC, tanpa rekap manual.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* --- ALUR KERJA: DARI PENGAMATAN HINGGA SKP --- */}
                <section id="alur" className="py-12 sm:py-16 lg:py-20 bg-white scroll-mt-20 sm:scroll-mt-24">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8 sm:mb-12">
                            <motion.div
                                {...reveal(0, { y: 48 })}
                                className="lg:col-span-4 space-y-2 pr-0 lg:pr-6"
                            >
                                <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                    ALUR KERJA
                                </span>
                                <h2 className="text-[24px] min-[360px]:text-[26px] sm:text-[34px] lg:text-[38px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                    Dari Pengamatan hingga SKP
                                </h2>
                                <p className="text-[14px] sm:text-[15px] text-[#4B5F7A] leading-relaxed pt-1">
                                    Dari pencatatan di lapangan hingga pengesahan berkas kinerja triwulan.
                                </p>
                            </motion.div>

                            {/* 4 Steps Timeline */}
                            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 relative">
                                {/* Connecting horizontal line for desktop */}
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    viewport={{ once: true, amount: 0.5 }}
                                    transition={{ duration: 1.4, ease: EASE }}
                                    className="hidden lg:block absolute top-6 left-6 right-6 h-[2px] bg-[#168BC5]/40 origin-left -z-0"
                                />

                                {/* Step 01 */}
                                <motion.div
                                    {...reveal(0.1, { y: 48 })}
                                    className="relative z-10 p-4 sm:p-0 rounded-2xl sm:rounded-none bg-[#EAF6FF]/50 sm:bg-transparent border border-[#D3E6F4] sm:border-0 space-y-2.5 sm:space-y-3"
                                >
                                    <motion.div whileHover={{ scale: 1.1, rotate: 4 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-[#168BC5] bg-white text-[#102B4E] font-bold text-[15px] sm:text-[16px] flex items-center justify-center shadow-xs">
                                        01
                                    </motion.div>
                                    <h3 className="text-[17px] sm:text-[18px] font-bold text-[#102B4E]">Pengamatan</h3>
                                    <p className="text-[13px] text-[#4B5F7A] leading-relaxed">
                                        Input pembacaan per slot (jam penuh dan AGM 1-B) dengan foto di jam 07.00 &amp; 17.00 WIB.
                                    </p>
                                </motion.div>

                                {/* Step 02 */}
                                <motion.div
                                    {...reveal(0.2, { y: 48 })}
                                    className="relative z-10 p-4 sm:p-0 rounded-2xl sm:rounded-none bg-[#EAF6FF]/50 sm:bg-transparent border border-[#D3E6F4] sm:border-0 space-y-2.5 sm:space-y-3"
                                >
                                    <motion.div whileHover={{ scale: 1.1, rotate: 4 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-[#168BC5] bg-white text-[#102B4E] font-bold text-[15px] sm:text-[16px] flex items-center justify-center shadow-xs">
                                        02
                                    </motion.div>
                                    <h3 className="text-[17px] sm:text-[18px] font-bold text-[#102B4E]">Validasi</h3>
                                    <p className="text-[13px] text-[#4B5F7A] leading-relaxed">
                                        Kaidah fisika (TBB ≤ TBK) dan batas wajar nilai diperiksa saat data disimpan.
                                    </p>
                                </motion.div>

                                {/* Step 03 */}
                                <motion.div
                                    {...reveal(0.3, { y: 48 })}
                                    className="relative z-10 p-4 sm:p-0 rounded-2xl sm:rounded-none bg-[#EAF6FF]/50 sm:bg-transparent border border-[#D3E6F4] sm:border-0 space-y-2.5 sm:space-y-3"
                                >
                                    <motion.div whileHover={{ scale: 1.1, rotate: 4 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-[#168BC5] bg-white text-[#102B4E] font-bold text-[15px] sm:text-[16px] flex items-center justify-center shadow-xs">
                                        03
                                    </motion.div>
                                    <h3 className="text-[17px] sm:text-[18px] font-bold text-[#102B4E]">Verifikasi</h3>
                                    <p className="text-[13px] text-[#4B5F7A] leading-relaxed">
                                        Penyelia meninjau antrean dan memberikan catatan revisi jika terdapat anomali.
                                    </p>
                                </motion.div>

                                {/* Step 04 */}
                                <motion.div
                                    {...reveal(0.4, { y: 48 })}
                                    className="relative z-10 p-4 sm:p-0 rounded-2xl sm:rounded-none bg-[#EAF6FF]/50 sm:bg-transparent border border-[#D3E6F4] sm:border-0 space-y-2.5 sm:space-y-3"
                                >
                                    <motion.div whileHover={{ scale: 1.1, rotate: 4 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-[#168BC5] bg-white text-[#102B4E] font-bold text-[15px] sm:text-[16px] flex items-center justify-center shadow-xs">
                                        04
                                    </motion.div>
                                    <h3 className="text-[17px] sm:text-[18px] font-bold text-[#102B4E]">Pengesahan</h3>
                                    <p className="text-[13px] text-[#4B5F7A] leading-relaxed">
                                        Penyelia meng-ACC per triwulan; data terkunci dan PDF laporan triwulan siap diunduh.
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- HASIL PELAPORAN: DOKUMEN SIAP DIGUNAKAN --- */}
                <section className="py-12 sm:py-16 lg:py-20 bg-[#EAF6FF]/30 border-t border-[#D3E6F4]">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                            <motion.div
                                {...reveal(0, { scale: 0.92, y: 32 })}
                                className="lg:col-span-6 flex flex-col items-center justify-center"
                            >
                                <div className="relative w-full max-w-[340px] min-[400px]:max-w-[420px] sm:max-w-[560px] group transition-transform duration-500 hover:scale-[1.02]">
                                    <img
                                        src="/images/landing/report-docs.png?v=pdf_aplikasi_v10"
                                        alt="Contoh PDF laporan triwulan SILAP-Kinerja: sampul serta lampiran bukti kinerja shift pagi dan shift siang"
                                        className="w-full h-auto object-contain"
                                    />
                                </div>
                                <div className="mt-4 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl sm:rounded-full bg-white border border-[#D3E6F4] shadow-xs text-center">
                                    <span className="w-2 h-2 rounded-full bg-[#168BC5] animate-pulse shrink-0" />
                                    <span className="text-[10px] min-[380px]:text-[11px] font-mono font-bold text-[#102B4E] uppercase tracking-wider">
                                        Cover Laporan Triwulan • Lampiran Shift Pagi • Lampiran Shift Siang
                                    </span>
                                </div>
                            </motion.div>

                            <motion.div
                                {...reveal(0, { x: 40 })}
                                className="lg:col-span-6 space-y-5 sm:space-y-6 pt-2 lg:pt-0"
                            >
                                <div className="space-y-2">
                                    <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                        HASIL PELAPORAN
                                    </span>
                                    <h2 className="text-[24px] min-[360px]:text-[26px] sm:text-[34px] lg:text-[38px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                        Berkas Laporan Siap Digunakan
                                    </h2>
                                    <p className="text-[14px] sm:text-[16px] text-[#4B5F7A] leading-relaxed pt-1">
                                        Dua jenis PDF: lembar per slot untuk input ulang ke form nasional, dan laporan triwulan sebagai bukti dukung SKP.
                                    </p>
                                </div>

                                <ul className="space-y-3 sm:space-y-3.5 text-[14px] sm:text-[15px] text-[#2B3F5C]">
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span><strong>Laporan triwulan (PDF):</strong> Ringkasan performa, rincian pengamatan, dan lampiran per shift; tersedia setelah ACC.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span><strong>Lembar per slot (PDF):</strong> Tata letak sama dengan tab FDIH form nasional, dapat diunduh setelah input.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span><strong>Laporan Kondisi Cuaca per shift:</strong> Ringkasan cuaca satu shift beserta foto kegiatan, menjadi lampiran laporan triwulan.</span>
                                    </li>
                                </ul>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* --- AKSES & PERAN PENGGUNA --- */}
                <section className="py-12 sm:py-16 lg:py-20 bg-[#EAF6FF] border-y border-[#D3E6F4]">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8 sm:mb-12">
                            <motion.div
                                {...reveal(0, { y: 48 })}
                                className="lg:col-span-4 space-y-2 pr-0 lg:pr-6"
                            >
                                <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                    AKSES &amp; PERAN PENGGUNA
                                </span>
                                <h2 className="text-[24px] min-[360px]:text-[26px] sm:text-[34px] lg:text-[38px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                    Tiga Peran, Satu Sistem
                                </h2>
                                <p className="text-[14px] sm:text-[15px] text-[#4B5F7A] leading-relaxed pt-1">
                                    Hak akses setiap pengguna disesuaikan dengan tanggung jawabnya di stasiun.
                                </p>
                            </motion.div>

                            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                {/* Pengamat */}
                                <motion.div
                                    {...reveal(0.1, { y: 48 })}
                                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                    className="bg-white rounded-2xl p-5 sm:p-6 border border-[#D3E6F4] shadow-xs flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center text-[#168BC5] mb-4 sm:mb-5">
                                            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102B4E] mb-2">Pengamat</h3>
                                        <p className="text-[13.5px] sm:text-[14px] text-[#4B5F7A] leading-relaxed">
                                            Mencatat pengamatan per slot, mengambil foto di slot 07.00 dan 17.00, memperbaiki data revisi, dan mengunduh laporan miliknya.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-[#D3E6F4]/60 text-[12px] font-mono text-[#0F6C9E] font-medium">
                                        Input pengamatan
                                    </div>
                                </motion.div>

                                {/* Penyelia */}
                                <motion.div
                                    {...reveal(0.2, { y: 48 })}
                                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                    className="bg-white rounded-2xl p-5 sm:p-6 border border-[#D3E6F4] shadow-xs flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center text-[#168BC5] mb-4 sm:mb-5">
                                            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102B4E] mb-2">Penyelia</h3>
                                        <p className="text-[13.5px] sm:text-[14px] text-[#4B5F7A] leading-relaxed">
                                            Memeriksa data, mengembalikan dengan catatan revisi bila keliru, dan meng-ACC per triwulan untuk tiap pegawai.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-[#D3E6F4]/60 text-[12px] font-mono text-[#0F6C9E] font-medium">
                                        Verifikasi &amp; ACC
                                    </div>
                                </motion.div>

                                {/* Administrator */}
                                <motion.div
                                    {...reveal(0.3, { y: 48 })}
                                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                    className="bg-white rounded-2xl p-5 sm:p-6 border border-[#D3E6F4] shadow-xs flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#EAF6FF] flex items-center justify-center text-[#168BC5] mb-4 sm:mb-5">
                                            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102B4E] mb-2">Administrator</h3>
                                        <p className="text-[13.5px] sm:text-[14px] text-[#4B5F7A] leading-relaxed">
                                            Mengelola akun, alat, dan parameter, serta membuka kunci triwulan bila perlu.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-[#D3E6F4]/60 text-[12px] font-mono text-[#0F6C9E] font-medium">
                                        Pengelolaan sistem
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- FAQ SECTION --- */}
                <section id="faq" className="py-12 sm:py-16 lg:py-20 bg-white scroll-mt-20 sm:scroll-mt-24">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                            <motion.div
                                {...reveal(0, { y: 48 })}
                                className="lg:col-span-4 space-y-2 pr-0 lg:pr-6"
                            >
                                <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                    FAQ
                                </span>
                                <h2 className="text-[24px] min-[360px]:text-[26px] sm:text-[34px] lg:text-[38px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                    Pertanyaan Umum
                                </h2>
                                <p className="text-[14px] sm:text-[15px] text-[#4B5F7A] leading-relaxed pt-1">
                                    Seputar akun, revisi data, foto, dan laporan triwulan.
                                </p>
                            </motion.div>

                            {/* Accordion List */}
                            <div className="lg:col-span-8 divide-y divide-[#D3E6F4] border-t border-b border-[#D3E6F4]">
                                {FAQ_ITEMS.map((faq, index) => {
                                    const isOpen = openFaqIndex === index;
                                    return (
                                        <div key={index} className="py-3.5 sm:py-5">
                                            <button
                                                onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                                                className="w-full flex items-center justify-between text-left gap-4 group"
                                            >
                                                <span className={`text-[15px] sm:text-[17px] font-semibold transition-colors duration-200 ${
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
                                                        <p className="pt-2.5 sm:pt-3 text-[14px] sm:text-[15px] text-[#4B5F7A] leading-relaxed">
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
                <section id="lokasi" className="pt-12 pb-32 sm:pt-20 sm:pb-28 bg-[#EAF6FF] border-t border-[#D3E6F4] scroll-mt-20 sm:scroll-mt-24">
                    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                            {/* Kiri: header dan info kontak */}
                            <motion.div
                                {...reveal(0, { x: -40 })}
                                className="lg:col-span-5 space-y-4 sm:space-y-6"
                            >
                                <div className="space-y-2">
                                    <span className="text-[11px] font-mono font-semibold tracking-wider text-[#168BC5] uppercase">
                                        LOKASI STASIUN
                                    </span>
                                    <h2 className="text-[24px] min-[360px]:text-[26px] sm:text-[34px] lg:text-[38px] font-bold text-[#102B4E] leading-tight tracking-tight">
                                        Stasiun Klimatologi Jawa Tengah
                                    </h2>
                                    <p className="text-[14px] sm:text-[15px] text-[#4B5F7A] leading-relaxed pt-1">
                                        Pusat pengamatan data iklim resmi BMKG di wilayah Jawa Tengah dengan fasilitas taman alat lengkap dan AWS digital.
                                    </p>
                                </div>

                                <ul className="space-y-3 sm:space-y-4 pt-1 sm:pt-2 text-[14px] sm:text-[15px] text-[#2B3F5C]">
                                    <li className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-[#168BC5] shrink-0 mt-0.5" />
                                        <span>Jl. Siliwangi No.{'\u00A0'}291, Semarang Barat, Kota Semarang 50145</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-[#168BC5] shrink-0" />
                                        <span>(024) 7609016</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-[#168BC5] shrink-0" />
                                        <span>staklim.jateng@bmkg.go.id</span>
                                    </li>
                                </ul>
                            </motion.div>

                            {/* Kanan: Google Maps embed polos */}
                            <motion.div
                                {...reveal(0, { y: 48 })}
                                className="lg:col-span-7"
                            >
                                <div className="w-full h-64 min-[400px]:h-72 sm:h-80 md:h-[25rem] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border-2 sm:border-4 border-white transform transition duration-500 hover:scale-[1.01] bg-slate-100">
                                    <iframe
                                        title="Peta Lokasi Stasiun Klimatologi Jawa Tengah"
                                        src="https://www.google.com/maps?q=Stasiun+Klimatologi+Jawa+Tengah+Semarang&output=embed"
                                        width="600"
                                        height="450"
                                        style={{ border: 0 }}
                                        allowFullScreen
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
            <footer className="bg-[#102B4E] text-[#C5D6EA] py-4 sm:py-5 border-t border-[#102B4E]">
                <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
                        {/* Footer Kiri: Logo & Nama Institusi */}
                        <div className="flex items-center gap-2.5">
                            <img
                                src="/images/brand/logo.png"
                                alt="Logo BMKG"
                                className="h-7 sm:h-9 w-auto object-contain brightness-110"
                            />
                            <div>
                                <span className="block font-bold text-[15px] sm:text-[16px] text-white leading-tight">
                                    SILAP-Kinerja
                                </span>
                                <span className="text-[11px] sm:text-[11.5px] font-medium text-[#8FD0F2] leading-tight block">
                                    Stasiun Klimatologi Jawa Tengah
                                </span>
                            </div>
                        </div>

                        {/* Footer Kanan: Hak Cipta */}
                        <div className="text-[12px] sm:text-[13px] text-[#A2BEDD] text-center sm:text-right font-medium">
                            © 2026. Hak Cipta Dilindungi.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
        </MotionConfig>
    );
}
