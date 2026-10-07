import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, FileSpreadsheet, FilePlus, UserCheck,
    Wrench, Users, LogOut, Sprout, FileText,
    Menu, X, User, ChevronRight
} from 'lucide-react';

function NavItem({ href, icon: Icon, label, active, onClick }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                active
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-700/90 text-white font-bold shadow-md shadow-emerald-950/40 border border-emerald-600/60 translate-x-0.5'
                    : 'text-emerald-100/75 font-medium hover:bg-white/10 hover:text-white hover:translate-x-1'
            }`}
        >
            <Icon
                className={`w-4 h-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 ${
                    active ? 'text-emerald-300' : 'text-emerald-200/60 group-hover:text-emerald-200'
                }`}
            />
            <span className="truncate">{label}</span>
            {active && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-emerald-300/80 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
            )}
        </Link>
    );
}

function SectionLabel({ label }) {
    return (
        <div className="px-3 pt-3.5 pb-1">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400/40">
                {label}
            </span>
        </div>
    );
}

export default function Sidebar({ children }) {
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

    const isActive = (routeName) => {
        try { return route().current(routeName); } catch { return false; }
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full overflow-hidden bg-[#0a3d20]">
            {/* Brand Header */}
            <Link
                href="/"
                className="group flex items-center gap-2.5 px-3.5 py-3.5 border-b border-emerald-900/50 shrink-0 transition-colors duration-300 hover:bg-white/5"
            >
                <img
                    src="/images/logo putih.png"
                    alt="BMKG"
                    className="h-7 w-auto object-contain shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105"
                />
                <div className="min-w-0">
                    <div className="font-extrabold text-white text-sm leading-tight tracking-tight truncate">SILAP-Kinerja</div>
                    <div className="text-[10px] text-emerald-300/80 font-medium truncate">Staklim Jawa Tengah</div>
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); close(); }}
                    className="ml-auto lg:hidden p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition duration-200"
                    aria-label="Tutup Menu"
                >
                    <X className="w-4 h-4" />
                </button>
            </Link>

            {/* Live Clock Bar */}
            <div className="px-3.5 py-2 bg-[#062915] border-b border-emerald-900/50 shrink-0 select-none">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="font-bold text-white font-mono tracking-tight">{liveTime.wib}</span>
                    <span className="text-emerald-700">|</span>
                    <span className="text-emerald-300/80 font-mono text-[10px] tracking-tight">{liveTime.utc}</span>
                </div>
            </div>

            {/* Navigation List with Hidden Scrollbar */}
            <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <NavItem href={route('dashboard')} icon={LayoutDashboard} label="Dashboard"
                    active={isActive('dashboard')} onClick={close} />

                <NavItem href={route('observations.index')} icon={FileSpreadsheet} label="Riwayat Observasi"
                    active={isActive('observations.index')} onClick={close} />

                {user?.role === 'pengamat' && (
                    <NavItem href={route('observations.create')} icon={FilePlus} label="Input Observasi"
                        active={isActive('observations.create')} onClick={close} />
                )}

                <NavItem href={route('phenology.index')} icon={Sprout} label="Fenologi"
                    active={isActive('phenology.*')} onClick={close} />

                <NavItem href={route('reports.monthly.index')} icon={FileText} label="Laporan Bulanan"
                    active={isActive('reports.monthly.*')} onClick={close} />

                {(user?.role === 'penyelia' || user?.role === 'admin') && (
                    <>
                        <SectionLabel label="Penyelia" />
                        <NavItem href={route('supervisor.queue')} icon={UserCheck} label="Antrean Validasi"
                            active={isActive('supervisor.queue')} onClick={close} />
                        <NavItem href={route('supervisor.skp.index')} icon={FileSpreadsheet} label="Rekap SKP"
                            active={isActive('supervisor.skp.*')} onClick={close} />
                    </>
                )}

                <SectionLabel label="Pengaturan" />
                <NavItem href={route('profile.edit')} icon={User} label="Profil Saya"
                    active={isActive('profile.edit')} onClick={close} />

                {user?.role === 'admin' && (
                    <>
                        <NavItem href={route('admin.users.index')} icon={Users} label="Kelola Pengguna"
                            active={isActive('admin.users.index')} onClick={close} />
                        <NavItem href={route('admin.instruments.index')} icon={Wrench} label="Kelola Alat"
                            active={isActive('admin.instruments.*')} onClick={close} />
                    </>
                )}
            </nav>

            {/* Bottom Logout Button */}
            <div className="shrink-0 border-t border-emerald-900/50 p-2.5 bg-[#062915]/90">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    onClick={close}
                    className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-950/60 hover:text-rose-200 hover:translate-x-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                >
                    <LogOut className="w-4 h-4 shrink-0 text-rose-400 group-hover:scale-110 transition-transform duration-300" />
                    <span>Keluar</span>
                </Link>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Desktop Sidebar (w-56) */}
            <aside className="hidden lg:flex flex-col w-56 shrink-0 h-full border-r border-emerald-900/40 shadow-lg">
                <SidebarContent />
            </aside>

            {/* Mobile Overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    onClick={close}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden shadow-2xl ${
                    open ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <SidebarContent />
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Mobile Topbar */}
                <header className="lg:hidden flex items-center gap-2.5 px-3.5 py-2.5 bg-[#0a3d20] border-b border-emerald-900/50 shrink-0">
                    <button
                        onClick={() => setOpen(true)}
                        className="p-1.5 rounded-lg text-white hover:bg-white/10 active:scale-95 transition duration-200"
                        aria-label="Buka menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <img src="/images/logo putih.png" alt="BMKG" className="h-6 w-auto object-contain" />
                    <span className="font-extrabold text-white text-xs tracking-tight">SILAP-Kinerja</span>
                    <div className="ml-auto text-[10px] text-emerald-300 font-mono font-semibold">{liveTime.wib}</div>
                </header>

                {/* Page Content View */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
