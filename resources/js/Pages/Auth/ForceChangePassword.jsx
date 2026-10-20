import React, { useState, useEffect } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import {
    Lock,
    KeyRound,
    ShieldAlert,
    ArrowLeft,
    Loader2
} from 'lucide-react';

const bgImages = ['/images/login/1.png', '/images/login/2.png', '/images/login/3.png'];

export default function ForceChangePassword() {
    const { data, setData, post, processing, errors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [bgIndex, setBgIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % bgImages.length);
        }, 7000);
        return () => clearInterval(timer);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.force_update'));
    };

    return (
        <div className="h-screen min-h-screen max-h-screen w-full bg-[#0A1B2F] flex flex-col justify-between relative overflow-y-auto sm:overflow-hidden select-none selection:bg-[#168BC5] selection:text-white p-3.5 sm:p-5 lg:p-6">
            <Head title="Wajib Ganti Password Pertama Kali - SILAP-Kinerja BMKG" />

            {/* Background Slideshow with Deep BMKG Navy Gradient & Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0A1B2F] via-[#102B4E] to-[#0A3D62]" />

                {bgImages.map((src, i) => (
                    <div
                        key={src}
                        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                        style={{ opacity: i === bgIndex ? 0.38 : 0 }}
                    >
                        <img
                            src={src}
                            alt="Stasiun Klimatologi Jawa Tengah"
                            className="w-full h-full object-cover object-center filter brightness-90 contrast-110 scale-105"
                        />
                    </div>
                ))}

                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1B2F] via-[#102B4E]/80 to-[#0A1B2F]/85" />
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#168BC5]/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
            </div>

            {/* Top Bar: Premium Styled Back Button (100% fit in view) */}
            <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between shrink-0">
                <Link
                    href="/"
                    className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold text-[#102B4E] bg-white/95 hover:bg-white shadow-md shadow-black/15 hover:shadow-lg hover:shadow-black/20 border border-white/80 transition-all duration-200 hover:-translate-x-0.5 active:translate-x-0 active:scale-95"
                >
                    <span className="w-5 h-5 rounded-full bg-[#EAF6FF] text-[#168BC5] flex items-center justify-center group-hover:bg-[#168BC5] group-hover:text-white transition-colors duration-200">
                        <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                    </span>
                    <span>Kembali ke Beranda</span>
                </Link>
            </header>

            {/* Main Center Content: Single Card */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-2 py-3 sm:py-4">
                <div className="w-full max-w-[390px] sm:max-w-[405px] bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-white/50 ring-1 ring-black/5">
                    {/* Header */}
                    <div className="text-center mb-4">
                        <img
                            src="/images/brand/logo.png"
                            alt="Logo BMKG"
                            className="h-12 sm:h-14 w-auto mx-auto object-contain mb-2"
                        />
                        <h1 className="text-[19px] sm:text-[21px] font-black text-[#102B4E] tracking-tight leading-tight">
                            Ganti Kata Sandi
                        </h1>
                    </div>

                    {/* Notice */}
                    <div className="flex items-start gap-2 mb-4 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-left">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-900 leading-snug font-medium">
                            Demi keamanan, Anda wajib mengganti kata sandi bawaan sebelum mengakses sistem.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-[#102B4E] mb-1">
                                Kata Sandi Saat Ini (Lama)
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#168BC5] transition-colors">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type="password"
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    className={`w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50/80 text-xs sm:text-sm text-[#102B4E] placeholder:text-slate-400 border transition-all duration-200 outline-none font-medium ${
                                        errors.current_password
                                            ? 'border-rose-400 bg-rose-50/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                                            : 'border-[#D3E6F4] hover:border-[#168BC5]/50 focus:bg-white focus:border-[#168BC5] focus:ring-2 focus:ring-[#168BC5]/20'
                                    }`}
                                    placeholder="Kata sandi lama"
                                    required
                                />
                            </div>
                            {errors.current_password && (
                                <p className="text-rose-600 text-[11px] mt-1 font-semibold">• {errors.current_password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#102B4E] mb-1">
                                Kata Sandi Baru
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#168BC5] transition-colors">
                                    <KeyRound className="w-4 h-4" />
                                </div>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className={`w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50/80 text-xs sm:text-sm text-[#102B4E] placeholder:text-slate-400 border transition-all duration-200 outline-none font-medium ${
                                        errors.password
                                            ? 'border-rose-400 bg-rose-50/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                                            : 'border-[#D3E6F4] hover:border-[#168BC5]/50 focus:bg-white focus:border-[#168BC5] focus:ring-2 focus:ring-[#168BC5]/20'
                                    }`}
                                    placeholder="Minimal 6 karakter"
                                    required
                                />
                            </div>
                            {errors.password && (
                                <p className="text-rose-600 text-[11px] mt-1 font-semibold">• {errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#102B4E] mb-1">
                                Konfirmasi Kata Sandi Baru
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#168BC5] transition-colors">
                                    <KeyRound className="w-4 h-4" />
                                </div>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50/80 text-xs sm:text-sm text-[#102B4E] placeholder:text-slate-400 border border-[#D3E6F4] hover:border-[#168BC5]/50 focus:bg-white focus:border-[#168BC5] focus:ring-2 focus:ring-[#168BC5]/20 transition-all duration-200 outline-none font-medium"
                                    placeholder="Ulangi kata sandi baru"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full h-10.5 sm:h-11 mt-1 inline-flex items-center justify-center gap-2 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#102B4E] via-[#0E5284] to-[#168BC5] hover:from-[#0B213D] hover:via-[#105F99] hover:to-[#1A9BE0] shadow-md shadow-[#102B4E]/20 hover:shadow-lg hover:shadow-[#168BC5]/25 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <span>Simpan &amp; Lanjutkan</span>
                            )}
                        </button>
                    </form>
                </div>
            </main>

            {/* Bottom Footer: Always in View at 100% Page */}
            <footer className="relative z-10 w-full text-center py-2 text-[11px] text-white/70 font-medium shrink-0">
                © 2026 BMKG Stasiun Klimatologi Jawa Tengah. Hak Cipta Dilindungi.
            </footer>
        </div>
    );
}
