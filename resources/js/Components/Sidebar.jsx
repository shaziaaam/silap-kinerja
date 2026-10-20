import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
    LayoutDashboard, FileSpreadsheet, FilePlus, UserCheck,
    Wrench, Users, LogOut, FileText,
    Menu, X, User, ChevronRight, CheckCircle, AlertCircle
} from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

// Setiap halaman membungkus dirinya dengan <Sidebar>, jadi komponen ini dibuat ulang saat pindah
// menu. Dua variabel modul berikut bertahan antar-halaman agar gerakannya terasa menyambung:
let sidebarSeen = false; // stagger masuk hanya saat pertama kali, bukan tiap pindah menu
let lastPill = null;     // posisi pil aktif terakhir, supaya pil meluncur ke menu baru

function NavItem({ href, icon: Icon, label, active, onClick, index, itemRef }) {
    return (
        <motion.div
            ref={itemRef}
            initial={sidebarSeen ? false : { opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: sidebarSeen ? 0 : 0.12 + index * 0.05, ease: EASE }}
            whileHover={{ x: 3 }}
            className="relative z-10"
        >
            <Link
                href={href}
                onClick={onClick}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 sm:py-2 text-xs rounded-xl transition-colors duration-300 active:scale-[0.98] ${
                    active
                        ? 'text-white font-bold'
                        : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700 font-medium'
                }`}
            >
                <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 ${
                        active ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'
                    }`}
                />
                <span className="truncate">{label}</span>
                {active && (
                    <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
                        className="ml-auto shrink-0"
                    >
                        <ChevronRight className="w-3.5 h-3.5 text-white" />
                    </motion.span>
                )}
            </Link>
        </motion.div>
    );
}

function SectionLabel({ label }) {
    return (
        <div className="px-3 pt-3.5 pb-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                {label}
            </span>
        </div>
    );
}

function isActiveRoute(routeName) {
    try { return route().current(routeName); } catch { return false; }
}

// Daftar menu per peran; `match` dipakai route().current untuk menandai menu aktif.
function menuItems(role) {
    const items = [
        { key: 'dashboard', href: route('dashboard'), icon: LayoutDashboard, label: 'Dashboard', match: 'dashboard' },
        { key: 'riwayat', href: route('observations.index'), icon: FileSpreadsheet, label: 'Riwayat Observasi', match: 'observations.index' },
    ];
    if (role === 'pengamat') {
        items.push(
            { key: 'input', href: route('observations.create'), icon: FilePlus, label: 'Input Observasi', match: 'observations.create' },
            { key: 'skp', href: route('supervisor.skp.index'), icon: FileText, label: 'Laporan Triwulan', match: 'supervisor.skp.*' },
        );
    }
    if (role === 'penyelia' || role === 'admin') {
        items.push(
            { section: 'Penyelia' },
            { key: 'antrean', href: route('supervisor.queue'), icon: UserCheck, label: 'Antrean Validasi', match: 'supervisor.queue' },
            { key: 'skp', href: route('supervisor.skp.index'), icon: FileSpreadsheet, label: 'Laporan Triwulan', match: 'supervisor.skp.*' },
        );
    }
    items.push(
        { section: 'Pengaturan' },
        { key: 'profil', href: route('profile.edit'), icon: User, label: 'Profil Saya', match: 'profile.edit' },
    );
    if (role === 'admin') {
        items.push(
            { key: 'users', href: route('admin.users.index'), icon: Users, label: 'Kelola Pengguna', match: 'admin.users.index' },
            { key: 'alat', href: route('admin.instruments.index'), icon: Wrench, label: 'Kelola Alat', match: 'admin.instruments.*' },
        );
    }
    return items;
}

function SidebarBody({ user, liveTime, close }) {
    const itemRefs = useRef({});
    const [pill, setPill] = useState(null);

    const items = menuItems(user?.role);
    const activeKey = items.find((it) => it.match && isActiveRoute(it.match))?.key;

    // Ukur menu aktif; pil hanya dirender bila instans ini terlihat (drawer/desktop).
    useLayoutEffect(() => {
        const measure = () => {
            const el = itemRefs.current[activeKey];
            setPill(el && el.offsetParent ? { top: el.offsetTop, height: el.offsetHeight } : null);
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [activeKey]);

    useEffect(() => {
        if (pill) lastPill = pill;
        sidebarSeen = true;
    }, [pill]);

    let order = 0;

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white border-r border-sky-100/80">
            {/* Brand Header */}
            <Link
                href="/"
                className="group flex items-center gap-2.5 px-3.5 py-3.5 border-b border-sky-100 shrink-0 transition-colors duration-300 hover:bg-sky-50/50"
            >
                <img
                    src="/images/brand/logo-hitam.webp"
                    alt="BMKG"
                    className="h-7 w-auto object-contain shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
                <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 text-sm leading-tight tracking-tight truncate">SILAP-Kinerja</div>
                    <div className="text-[10px] text-sky-600 font-semibold truncate">Staklim Jawa Tengah</div>
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); close(); }}
                    className="ml-auto lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-sky-50 active:scale-90 transition-all duration-200 ease-out"
                    aria-label="Tutup Menu"
                >
                    <X className="w-4 h-4" />
                </button>
            </Link>

            {/* Live Clock Bar */}
            <div className="px-3.5 py-2 bg-sky-50 border-b border-sky-100 text-sky-900 text-xs font-mono font-bold shrink-0 select-none">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-sky-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse shrink-0" />
                    <span className="font-bold text-slate-900 font-mono tracking-tight">{liveTime.wib}</span>
                    <span className="text-sky-300">|</span>
                    <span className="text-slate-500 font-mono text-[10px] tracking-tight">{liveTime.utc}</span>
                </div>
            </div>

            {/* Navigation List with Hidden Scrollbar */}
            <nav className="relative flex-1 overflow-y-auto px-2.5 py-2.5 space-y-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {pill && (
                    <motion.div
                        aria-hidden="true"
                        initial={lastPill
                            ? { y: lastPill.top, height: lastPill.height, opacity: 1 }
                            : { y: pill.top, height: pill.height, opacity: 0 }}
                        animate={{ y: pill.top, height: pill.height, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.9 }}
                        className="absolute left-2.5 right-2.5 top-0 z-0 rounded-xl bg-sky-600 shadow-sm shadow-sky-600/30"
                    />
                )}

                {items.map((it) =>
                    it.section ? (
                        <SectionLabel key={`s-${it.section}`} label={it.section} />
                    ) : (
                        <NavItem
                            key={it.key}
                            href={it.href}
                            icon={it.icon}
                            label={it.label}
                            active={it.key === activeKey}
                            onClick={close}
                            index={order++}
                            itemRef={(el) => { itemRefs.current[it.key] = el; }}
                        />
                    )
                )}
            </nav>

            {/* Bottom User Profile & Logout */}
            <div className="shrink-0 border-t border-sky-100 p-2.5 bg-slate-50/50 space-y-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
                {user && (
                    <div className="px-2.5 py-2 rounded-xl bg-white border border-sky-100 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {user.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-900 truncate leading-tight">{user.nama}</div>
                                <div className="text-[10px] text-sky-600 font-semibold capitalize truncate">{user.role} · {user.nip}</div>
                            </div>
                        </div>
                    </div>
                )}
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    onClick={close}
                    className="group w-full flex items-center gap-2.5 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:translate-x-0.5 active:scale-[0.98] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                >
                    <LogOut className="w-4 h-4 shrink-0 text-rose-500 group-hover:scale-105 transition-transform duration-200 ease-out" />
                    <span>Keluar</span>
                </Link>
            </div>
        </div>
    );
}

// Pesan hasil aksi dari server: flash.success / flash.message (hijau), flash.error / errors.message (merah).
// Halaman yang sudah menampilkan pesan sendiri memakai <Sidebar toast={false}> agar tidak ganda.
function FlashToast() {
    const { flash, errors } = usePage().props;
    const sukses = flash?.success || flash?.message || null;
    const galat = flash?.error || errors?.message || null;
    const teks = galat || sukses;
    const nada = galat ? 'error' : 'ok';

    const [toast, setToast] = useState(teks ? { teks, nada } : null);

    // Kunci pada teks: kunjungan berikutnya dengan pesan baru menampilkan toast baru; partial reload
    // (polling) tidak membawa flash sehingga toast yang sedang tampil tidak terhapus.
    useEffect(() => {
        if (teks) setToast({ teks, nada });
    }, [teks, nada]);

    useEffect(() => {
        if (!toast) return undefined;
        const id = setTimeout(() => setToast(null), 7000);
        return () => clearTimeout(id);
    }, [toast]);

    return (
        <div className="fixed top-4 right-4 z-[60] w-[calc(100%-2rem)] sm:w-96 pointer-events-none">
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key={toast.teks}
                        role={toast.nada === 'error' ? 'alert' : 'status'}
                        initial={{ opacity: 0, y: -16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.97 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs font-medium shadow-lg ${
                            toast.nada === 'error'
                                ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-200/50'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-200/50'
                        }`}
                    >
                        {toast.nada === 'error'
                            ? <AlertCircle className="w-4 h-4 shrink-0 mt-px text-rose-600" />
                            : <CheckCircle className="w-4 h-4 shrink-0 mt-px text-emerald-600" />}
                        <span className="flex-1 leading-snug">{toast.teks}</span>
                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            className="shrink-0 -mr-1 p-0.5 rounded text-current opacity-60 hover:opacity-100 transition"
                            aria-label="Tutup pesan"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Sidebar({ children, toast = true }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [open, setOpen] = useState(false);
    const [liveTime, setLiveTime] = useState({ wib: '', utc: '' });

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setLiveTime({
                wib: now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false }) + ' WIB',
                utc: now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false }) + ' UTC',
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const close = () => setOpen(false);

    return (
        <MotionConfig reducedMotion="user">
            <div className="flex h-screen h-dvh bg-slate-50 overflow-hidden">
                {toast && <FlashToast />}

                {/* Desktop Sidebar (w-56) */}
                <aside className="hidden lg:flex flex-col w-56 shrink-0 h-full border-r border-sky-100 shadow-sm bg-white">
                    <SidebarBody user={user} liveTime={liveTime} close={close} />
                </aside>

                {/* Mobile Overlay */}
                <div
                    className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                    onClick={close}
                    aria-hidden="true"
                />

                {/* Mobile Drawer */}
                <aside
                    className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform lg:hidden shadow-xl ${
                        open ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <SidebarBody user={user} liveTime={liveTime} close={close} />
                </aside>

                {/* Main Content Area */}
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    {/* Mobile Topbar */}
                    <header className="lg:hidden flex items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-white border-b border-sky-100 shrink-0 shadow-xs">
                        <div className="flex items-center gap-2 min-w-0">
                            <button
                                onClick={() => setOpen(true)}
                                className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-700 hover:bg-sky-50 active:scale-95 border border-sky-100 transition duration-150"
                                aria-label="Buka menu navigasi"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <img src="/images/brand/logo-hitam.webp" alt="BMKG" className="h-6 sm:h-7 w-auto object-contain shrink-0" />
                            <div className="min-w-0">
                                <span className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight truncate block">SILAP-Kinerja</span>
                                <span className="text-[9px] text-sky-600 font-semibold truncate block sm:hidden">Staklim Jateng</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {user && (
                                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 capitalize">
                                    {user.role}
                                </span>
                            )}
                            <div className="text-[10px] sm:text-xs text-sky-900 font-mono font-bold bg-sky-50 px-2 py-1 rounded-lg border border-sky-100">
                                {liveTime.wib}
                            </div>
                        </div>
                    </header>

                    {/* Page Content View: isi halaman naik bertahap saat dibuka (lihat .page-enter di app.css) */}
                    <main className="flex-1 overflow-y-auto page-enter">
                        {children}
                    </main>
                </div>
            </div>
        </MotionConfig>
    );
}
