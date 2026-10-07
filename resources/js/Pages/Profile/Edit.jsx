import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import { User, Lock, Save, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const inputClass = "w-full border border-slate-200 rounded-lg px-3 h-8 text-slate-900 text-xs placeholder:text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition font-medium bg-white";

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {label}
            </label>
            {children}
            {error && (
                <p className="flex items-center gap-1 text-xs text-rose-600 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                </p>
            )}
        </div>
    );
}

function PasswordInput({ value, onChange, placeholder, ...rest }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={inputClass + ' pr-9'}
                {...rest}
            />
            <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                tabIndex={-1}
            >
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
}

export default function ProfileEdit({ user }) {
    const { flash } = usePage().props;

    const form = useForm({
        nama:  user.nama  ?? '',
        nip:   user.nip   ?? '',
        email: user.email ?? '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.put(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                form.setData('current_password', '');
                form.setData('password', '');
                form.setData('password_confirmation', '');
            }
        });
    };

    return (
        <Sidebar>
            <Head title="Profil Saya - SILAP-Kinerja" />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

                {/* Flash success */}
                {flash?.success && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Page header */}
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Profil Saya</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola informasi identitas akun dan kata sandi Anda.
                    </p>
                </div>

                {/* Single Combined Card */}
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
                    <form onSubmit={submit} className="p-6 space-y-6">

                        {/* Section 1: Informasi Identitas */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <User className="w-4 h-4 text-emerald-600" />
                                <h2 className="font-semibold text-sm text-slate-900">Informasi Pengguna</h2>
                            </div>

                            <Field label="Nama Lengkap" error={form.errors.nama}>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={form.data.nama}
                                    onChange={e => form.setData('nama', e.target.value)}
                                    placeholder="Nama lengkap"
                                    autoComplete="name"
                                    required
                                />
                            </Field>

                            <Field label="NIP" error={form.errors.nip}>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={form.data.nip}
                                    onChange={e => form.setData('nip', e.target.value)}
                                    placeholder="Nomor Induk Pegawai"
                                    autoComplete="username"
                                    required
                                />
                            </Field>

                            <Field label="Email (opsional)" error={form.errors.email}>
                                <input
                                    type="email"
                                    className={inputClass}
                                    value={form.data.email}
                                    onChange={e => form.setData('email', e.target.value)}
                                    placeholder="Alamat email"
                                    autoComplete="email"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Email dapat digunakan sebagai alternatif login selain NIP.
                                </p>
                            </Field>

                            {/* Role badge */}
                            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Peran Akun</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                                    user.role === 'admin'    ? 'bg-violet-100 text-violet-700 border border-violet-200' :
                                    user.role === 'penyelia' ? 'bg-amber-100 text-amber-700 border border-amber-200'   :
                                                               'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                }`}>
                                    {user.role}
                                </span>
                            </div>
                        </div>

                        {/* Section 2: Ubah Kata Sandi (Opsional) */}
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <Lock className="w-4 h-4 text-emerald-600" />
                                <h2 className="font-semibold text-sm text-slate-900">Ubah Kata Sandi (Opsional)</h2>
                            </div>
                            <p className="text-xs text-slate-500 -mt-2">
                                Kosongkan bagian ini jika tidak ingin mengubah kata sandi.
                            </p>

                            <Field label="Kata Sandi Saat Ini" error={form.errors.current_password}>
                                <PasswordInput
                                    value={form.data.current_password}
                                    onChange={e => form.setData('current_password', e.target.value)}
                                    placeholder="Masukkan password saat ini"
                                    autoComplete="current-password"
                                />
                            </Field>

                            <Field label="Kata Sandi Baru" error={form.errors.password}>
                                <PasswordInput
                                    value={form.data.password}
                                    onChange={e => form.setData('password', e.target.value)}
                                    placeholder="Minimal 6 karakter"
                                    autoComplete="new-password"
                                />
                            </Field>

                            <Field label="Konfirmasi Kata Sandi Baru" error={form.errors.password_confirmation}>
                                <PasswordInput
                                    value={form.data.password_confirmation}
                                    onChange={e => form.setData('password_confirmation', e.target.value)}
                                    placeholder="Ulangi password baru"
                                    autoComplete="new-password"
                                />
                            </Field>
                        </div>

                        {/* Single Submit Button */}
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-xs disabled:opacity-60"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>{form.processing ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Sidebar>
    );
}
