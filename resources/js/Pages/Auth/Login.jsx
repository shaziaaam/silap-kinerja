import React, { useState, useEffect } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import { Lock, UserCheck, ShieldAlert, ArrowLeft, ExternalLink } from 'lucide-react';

const bgImages = ['/images/3.png', '/images/1.png', '/images/2.png'];

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        nip: '',
        password: '',
        remember: false,
    });

    const [bg, setBg] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setBg(p => (p + 1) % bgImages.length), 6000);
        return () => clearInterval(t);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <Head title="Login Pegawai - SILAP-Kinerja BMKG" />

            {/* Background slideshow photos */}
            {bgImages.map((src, i) => (
                <div
                    key={src}
                    className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                    style={{ opacity: i === bg ? 1 : 0, zIndex: 0 }}
                >
                    <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}

            {/* Dark overlay over photo */}
            <div
                className="absolute inset-0 z-[1]"
                style={{ background: 'linear-gradient(135deg, rgba(10,40,20,0.72) 0%, rgba(15,74,42,0.65) 50%, rgba(10,30,15,0.80) 100%)' }}
            />

            {/* Back link - Styled Green Button */}
            <div className="absolute top-4 left-4 z-20">
                <Link
                    href="/"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-950/30 transition duration-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Beranda</span>
                </Link>
            </div>

            {/* Center content */}
            <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-4 py-10">

                {/* Card */}
                <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-7 sm:p-8 shadow-2xl shadow-black/40 border border-white/60">

                    {/* Logo & Header */}
                    <div className="text-center mb-6">
                        <div className="flex flex-col items-center justify-center mb-3">
                            <img
                                src="/images/logo putih.png"
                                alt="Logo BMKG"
                                className="h-16 w-auto object-contain drop-shadow-sm"
                            />
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">SILAP-Kinerja</h1>
                        <p className="text-xs font-bold text-emerald-700 mt-1">
                            Portal Kinerja Pegawai BMKG
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                NIP atau Email
                            </label>
                            <div className="relative">
                                <UserCheck className="w-4 h-4 absolute left-3.5 top-3 text-emerald-600 pointer-events-none" />
                                <input
                                    type="text"
                                    value={data.nip}
                                    onChange={(e) => setData('nip', e.target.value)}
                                    className="w-full rounded-xl pl-10 pr-3 py-2 bg-slate-50 text-slate-900 text-xs placeholder:text-xs border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition outline-none"
                                    placeholder="Masukkan NIP atau email"
                                    required
                                />
                            </div>
                            {errors.nip && <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.nip}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-emerald-600 pointer-events-none" />
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full rounded-xl pl-10 pr-3 py-2 bg-slate-50 text-slate-900 text-xs placeholder:text-xs border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {errors.password && <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full font-bold py-3 rounded-xl text-sm transition duration-200 shadow-lg shadow-emerald-600/25 text-white bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600 hover:from-emerald-800 hover:to-green-700 active:scale-[0.99] disabled:opacity-50 mt-2"
                        >
                            {processing ? 'Memproses...' : 'Masuk ke Sistem'}
                        </button>
                    </form>

                    {/* Footer Notice */}
                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-center">
                        <p className="text-[10px] text-slate-500 flex items-center justify-center space-x-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Sistem internal — hanya untuk ASN BMKG Staklim Jateng</span>
                        </p>
                        <a
                            href="https://staklim-jateng.bmkg.go.id/"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold"
                        >
                            <span>Bukan pegawai? Kunjungi Web Resmi BMKG Jateng</span>
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                {/* Copyright */}
                <p className="mt-4 text-[11px] text-white/50 z-10 font-medium">
                    © 2026 BMKG Stasiun Klimatologi Jawa Tengah
                </p>
            </div>
        </div>
    );
}
