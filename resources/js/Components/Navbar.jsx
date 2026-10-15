import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { UserCheck, FileSpreadsheet, Users, LogOut, LayoutDashboard, FilePlus, Menu, X, Settings, Wrench, ChevronDown, FileText } from 'lucide-react';

export default function Navbar() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [liveTime, setLiveTime] = useState({ wib: '', utc: '' });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const navRef = useRef(null);
    const settingsRef = useRef(null);
    const [pillStyle, setPillStyle] = useState({ opacity: 0, left: 0, width: 0 });

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const wibStr = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false }) + ' WIB';
            const utcStr = now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false }) + ' UTC';
            setLiveTime({ wib: wibStr, utc: utcStr });
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Close settings dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMouseEnter = (e) => {
        if (!navRef.current) return;
        const itemRect = e.currentTarget.getBoundingClientRect();
        const navRect = navRef.current.getBoundingClientRect();
        setPillStyle({
            opacity: 1,
            left: itemRect.left - navRect.left,
            width: itemRect.width,
        });
    };

    const handleMouseLeave = () => {
        setPillStyle((prev) => ({ ...prev, opacity: 0 }));
    };

    return (
        <>
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-8 h-16 flex items-center justify-between gap-2">
                {/* Brand */}
                <Link href="/" className="flex items-center space-x-2.5 group shrink-0">
                    <img
                        src="/images/logo hitam.webp"
                        alt="Logo BMKG"
                        className="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition duration-300"
                    />
                    <div>
                        <div className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-none">SILAP-Kinerja</div>
                        <p className="text-[10px] sm:text-[11px] text-sky-600 font-semibold mt-0.5">BMKG Staklim Jawa Tengah</p>
                    </div>
                </Link>

                {/* Navigation Links (Desktop xl+) */}
                {user && (
                    <nav
                        ref={navRef}
                        onMouseLeave={handleMouseLeave}
                        className="hidden xl:flex items-center relative space-x-1"
                    >
                        {/* Sliding glass pill indicator */}
                        <div
                            className="absolute top-0 bottom-0 rounded-full bg-sky-100/70 shadow-xs border border-sky-200/80 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
                            style={{
                                opacity: pillStyle.opacity,
                                transform: `translateX(${pillStyle.left}px)`,
                                width: `${pillStyle.width}px`,
                            }}
                        />

                        <Link
                            onMouseEnter={handleMouseEnter}
                            href={route('dashboard')}
                            className={`relative z-10 px-3 xl:px-3.5 py-2 rounded-full text-xs xl:text-sm font-bold whitespace-nowrap transition-colors duration-200 flex items-center space-x-1.5 ${
                                route().current('dashboard') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-sky-700'
                            }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            onMouseEnter={handleMouseEnter}
                            href={route('observations.index')}
                            className={`relative z-10 px-3 xl:px-3.5 py-2 rounded-full text-xs xl:text-sm font-bold whitespace-nowrap transition-colors duration-200 flex items-center space-x-1.5 ${
                                route().current('observations.index') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-sky-700'
                            }`}
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Riwayat Observasi</span>
                        </Link>

                        <Link
                            onMouseEnter={handleMouseEnter}
                            href={route('reports.monthly.index')}
                            className={`relative z-10 px-3 xl:px-3.5 py-2 rounded-full text-xs xl:text-sm font-bold whitespace-nowrap transition-colors duration-200 flex items-center space-x-1.5 ${
                                route().current('reports.monthly.*') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-sky-700'
                            }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span>Laporan Bulanan</span>
                        </Link>

                        {user.role === 'pengamat' && (
                            <Link
                                onMouseEnter={handleMouseEnter}
                                href={route('observations.create')}
                                className={`relative z-10 px-3 xl:px-3.5 py-2 rounded-full text-xs xl:text-sm font-bold whitespace-nowrap transition-colors duration-200 flex items-center space-x-1.5 ${
                                    route().current('observations.create') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-sky-700'
                                }`}
                            >
                                <FilePlus className="w-4 h-4" />
                                <span>Input Observasi</span>
                            </Link>
                        )}

                        {user.role === 'penyelia' && (
                            <>
                                <Link
                                    onMouseEnter={handleMouseEnter}
                                    href={route('supervisor.queue')}
                                    className={`relative z-10 px-3 xl:px-3.5 py-2 rounded-full text-xs xl:text-sm font-bold whitespace-nowrap transition-colors duration-200 flex items-center space-x-1.5 ${
                                        route().current('supervisor.queue') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-sky-700'
                                    }`}
                                >
                                    <UserCheck className="w-4 h-4" />
                                    <span>Antrean Validasi</span>
                                </Link>
                                <Link
                                    onMouseEnter={handleMouseEnter}
                                    href={route('supervisor.skp.index')}
                                    className={`relative z-10 px-3 xl:px-3.5 py-2 rounded-full text-xs xl:text-sm font-bold whitespace-nowrap transition-colors duration-200 flex items-center space-x-1.5 ${
                                        route().current('supervisor.skp.*') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-sky-700'
                                    }`}
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span>Rekap SKP</span>
                                </Link>
                            </>
                        )}

                        {user.role === 'admin' && (
                            <>
                                <Link
                                    onMouseEnter={handleMouseEnter}
                                    href={route('supervisor.queue')}
                                    className={`relative z-10 px-3 xl:px-3.5 py-2 rounded-full text-xs xl:text-sm font-bold whitespace-nowrap transition-colors duration-200 flex items-center space-x-1.5 ${
                                        route().current('supervisor.queue') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-sky-700'
                                    }`}
                                >
                                    <UserCheck className="w-4 h-4" />
                                    <span>Antrean Validasi</span>
                                </Link>
                                <Link
                                    onMouseEnter={handleMouseEnter}
                                    href={route('supervisor.skp.index')}
                                    className={`relative z-10 px-3 xl:px-3.5 py-2 rounded-full text-xs xl:text-sm font-bold whitespace-nowrap transition-colors duration-200 flex items-center space-x-1.5 ${
                                        route().current('supervisor.skp.*') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-sky-700'
                                    }`}
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span>Rekap SKP</span>
                                </Link>

                                {/* Grup Pengaturan (dropdown) */}
                                <div className="relative z-10" ref={settingsRef}>
                                    <button
                                        onClick={() => setSettingsOpen(!settingsOpen)}
                                        className={`px-3 xl:px-3.5 py-2 rounded-full text-xs xl:text-sm font-bold whitespace-nowrap transition-colors duration-200 flex items-center space-x-1.5 ${
                                            (route().current('admin.users.index') || route().current('admin.instruments.*'))
                                                ? 'text-sky-700 bg-sky-50'
                                                : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/50'
                                        }`}
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Pengaturan</span>
                                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {settingsOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden z-50">
                                            <Link
                                                href={route('admin.users.index')}
                                                onClick={() => setSettingsOpen(false)}
                                                className="flex items-center space-x-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                                            >
                                                <Users className="w-4 h-4 text-sky-600" />
                                                <span>Kelola Pengguna</span>
                                            </Link>
                                            <Link
                                                href={route('admin.instruments.index')}
                                                onClick={() => setSettingsOpen(false)}
                                                className="flex items-center space-x-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition border-t border-sky-100"
                                            >
                                                <Wrench className="w-4 h-4 text-sky-600" />
                                                <span>Kelola Alat</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </nav>
                )}

                {/* User Info & Logout (Desktop) + Mobile Hamburger */}
                {user && (
                    <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs xl:text-sm font-bold text-slate-900 leading-snug">{user.nama}</div>
                            <div className="text-[10px] xl:text-xs font-semibold capitalize text-sky-600">
                                {user.role} (NIP: {user.nip})
                            </div>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="hidden sm:flex p-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-rose-50 text-slate-500 hover:text-rose-600 hover:scale-105 active:scale-95 border border-transparent hover:border-rose-100 shrink-0"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </Link>

                        {/* Mobile Hamburger Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="xl:hidden p-2 sm:p-2.5 rounded-2xl text-slate-700 hover:bg-sky-50 active:scale-95 transition border border-sky-100"
                            aria-label="Toggle Navigation Menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-sky-100 px-4 pt-3 pb-6 space-y-2 shadow-xl">
                    {user && (
                        <>
                            <div className="px-4 py-3 rounded-2xl bg-sky-50/60 border border-sky-100 mb-3">
                                <div className="text-base font-bold text-slate-900">{user.nama}</div>
                                <div className="text-xs text-sky-600 font-semibold capitalize mt-0.5">
                                    {user.role} (NIP: {user.nip})
                                </div>
                            </div>

                            <Link
                                href={route('dashboard')}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition ${
                                    route().current('dashboard') ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                                }`}
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                <span>Dashboard</span>
                            </Link>

                            <Link
                                href={route('observations.index')}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition ${
                                    route().current('observations.index') ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                                }`}
                            >
                                <FileSpreadsheet className="w-5 h-5" />
                                <span>Riwayat Observasi</span>
                            </Link>

                            {user.role === 'pengamat' && (
                                <Link
                                    href={route('observations.create')}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition ${
                                        route().current('observations.create') ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                                    }`}
                                >
                                    <FilePlus className="w-5 h-5" />
                                    <span>Input Observasi</span>
                                </Link>
                            )}

                            {(user.role === 'penyelia' || user.role === 'admin') && (
                                <>
                                    <Link
                                        href={route('supervisor.queue')}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition ${
                                            route().current('supervisor.queue') ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                                        }`}
                                    >
                                        <UserCheck className="w-5 h-5" />
                                        <span>Antrean Validasi</span>
                                    </Link>
                                    <Link
                                        href={route('supervisor.skp.index')}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition ${
                                            route().current('supervisor.skp.*') ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                                        }`}
                                    >
                                        <FileSpreadsheet className="w-5 h-5" />
                                        <span>Rekap SKP</span>
                                    </Link>
                                </>
                            )}

                            {user.role === 'admin' && (
                                <>
                                    <div className="px-4 pt-2 pb-1">
                                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Pengaturan</div>
                                    </div>
                                    <Link
                                        href={route('admin.users.index')}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition ${
                                            route().current('admin.users.index') ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                                        }`}
                                    >
                                        <Users className="w-5 h-5" />
                                        <span>Kelola Pengguna</span>
                                    </Link>
                                    <Link
                                        href={route('admin.instruments.index')}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition ${
                                            route().current('admin.instruments.*') ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                                        }`}
                                    >
                                        <Wrench className="w-5 h-5" />
                                        <span>Kelola Alat</span>
                                    </Link>
                                </>
                            )}

                            <div className="pt-3 border-t border-sky-100 mt-2">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-base transition shadow-sm"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Keluar / Logout</span>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            )}
        </header>

        {/* Floating Live Clock Widget at Bottom Right */}
        <div className="fixed bottom-4 right-4 z-40 bg-white/95 text-slate-800 backdrop-blur-md shadow-md border border-sky-100 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center space-x-2 select-none hover:bg-white transition opacity-95 hover:opacity-100">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0 shadow-xs"></span>
            <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight">{liveTime.wib}</span>
                <span className="text-sky-300 font-mono text-xs">|</span>
                <span className="text-slate-500 font-medium tracking-tight text-xs">{liveTime.utc}</span>
            </div>
        </div>
        </>
    );
}
