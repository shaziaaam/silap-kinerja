import React, { useState, useEffect } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { ShieldAlert, Lock } from 'lucide-react';

const bgImages = ['/images/login/1.png', '/images/login/2.png', '/images/login/3.png'];

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
        <div className="min-h-screen min-h-dvh bg-gradient-to-br from-sky-50 via-white to-slate-50 flex flex-col relative overflow-hidden">
            <Head title="Wajib Ganti Password Pertama Kali - SILAP-Kinerja BMKG" />

            {/* Background slideshow photos */}
            {bgImages.map((src, i) => (
                <div
                    key={src}
                    className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                    style={{ opacity: i === bg ? 0.35 : 0, zIndex: 0 }}
                >
                    <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}

            {/* Light Glass Overlay */}
            <div
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(240,249,255,0.85) 0%, rgba(255,255,255,0.90) 50%, rgba(241,245,249,0.88) 100%)' }}
            />

            {/* Center content */}
            <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-4 py-10">

                {/* Change Password Card */}
                <div className="w-full max-w-sm bg-white border border-sky-100 rounded-2xl p-7 sm:p-8 shadow-xl shadow-sky-100/50">
                    
                    {/* Logo & Header */}
                    <div className="text-center mb-5">
                        <div className="flex flex-col items-center justify-center mb-3">
                            <img
                                src="/images/brand/logo-hitam.webp"
                                alt="Logo BMKG"
                                className="h-16 w-auto object-contain"
                            />
                        </div>
                        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Ganti Password Pertama Kali
                        </h1>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-sky-600 mt-1">
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
                                className="w-full rounded-xl px-3 py-2 bg-slate-50 text-slate-900 text-xs placeholder:text-xs border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-100 transition outline-none font-medium"
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
                                className="w-full rounded-xl px-3 py-2 bg-slate-50 text-slate-900 text-xs placeholder:text-xs border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-100 transition outline-none font-medium"
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
                                className="w-full rounded-xl px-3 py-2 bg-slate-50 text-slate-900 text-xs placeholder:text-xs border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-100 transition outline-none font-medium"
                                placeholder="Ulangi password baru"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full font-bold py-3 rounded-xl text-sm transition duration-200 shadow-sm shadow-sky-600/30 text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
                        >
                            <Lock className="w-4 h-4" />
                            <span>{processing ? 'Menyimpan...' : 'Simpan & Lanjutkan'}</span>
                        </button>
                    </form>
                </div>

                {/* Copyright */}
                <p className="mt-4 text-[11px] text-slate-500 font-medium">
                    © 2026 BMKG Stasiun Klimatologi Jawa Tengah
                </p>
            </div>
        </div>
    );
}
