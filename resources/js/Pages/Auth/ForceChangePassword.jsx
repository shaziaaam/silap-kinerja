import React, { useState, useEffect } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { ShieldAlert, Lock } from 'lucide-react';

const bgImages = ['/images/1.png', '/images/2.png', '/images/3.png'];

export default function ForceChangePassword() {
    const { data, setData, post, processing, errors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [bg, setBg] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setBg(p => (p + 1) % bgImages.length), 6000);
        return () => clearInterval(t);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.force_update'));
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <Head title="Wajib Ganti Password Pertama Kali - SILAP-Kinerja BMKG" />

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

            {/* Dark green overlay over photo */}
            <div
                className="absolute inset-0 z-[1]"
                style={{ background: 'linear-gradient(135deg, rgba(10,40,20,0.75) 0%, rgba(15,74,42,0.70) 50%, rgba(10,30,15,0.85) 100%)' }}
            />

            {/* Center content */}
            <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-4 py-10">

                {/* Change Password Card - Glass Card Matching Login Page */}
                <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-7 sm:p-8 shadow-2xl shadow-black/40 border border-white/60">
                    
                    {/* Logo & Header (No background shape) */}
                    <div className="text-center mb-5">
                        <div className="flex flex-col items-center justify-center mb-3">
                            <img
                                src="/images/logo-bmkg.webp"
                                alt="Logo BMKG"
                                className="h-16 w-auto object-contain drop-shadow-sm"
                            />
                        </div>
                        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Ganti Password Pertama Kali
                        </h1>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mt-1">
                            BMKG Stasiun Klimatologi Jawa Tengah
                        </p>
                    </div>

                    {/* Warning Banner */}
                    <div className="flex items-start space-x-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-900 leading-snug font-medium">
                            Demi keamanan, Anda wajib mengganti password bawaan sebelum mengakses sistem.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Password Saat Ini (Lama)
                            </label>
                            <input
                                type="password"
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                className="w-full rounded-xl px-3 py-2 bg-slate-50 text-slate-900 text-xs placeholder:text-xs border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition outline-none font-medium"
                                placeholder="Password lama saat ini"
                                required
                            />
                            {errors.current_password && <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.current_password}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Password Baru
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full rounded-xl px-3 py-2 bg-slate-50 text-slate-900 text-xs placeholder:text-xs border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition outline-none font-medium"
                                placeholder="Minimal 6 karakter"
                                required
                            />
                            {errors.password && <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Konfirmasi Password Baru
                            </label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="w-full rounded-xl px-3 py-2 bg-slate-50 text-slate-900 text-xs placeholder:text-xs border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition outline-none font-medium"
                                placeholder="Ulangi password baru"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full font-bold py-3 rounded-xl text-sm transition duration-200 shadow-lg shadow-emerald-600/25 text-white bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600 hover:from-emerald-800 hover:to-green-700 active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
                        >
                            <Lock className="w-4 h-4" />
                            <span>{processing ? 'Menyimpan...' : 'Simpan & Lanjutkan'}</span>
                        </button>
                    </form>
                </div>

                {/* Copyright */}
                <p className="mt-4 text-[11px] text-white/50 font-medium">
                    © 2026 BMKG Stasiun Klimatologi Jawa Tengah
                </p>
            </div>
        </div>
    );
}
