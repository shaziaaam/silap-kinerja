import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import Sidebar from '../../Components/Sidebar';
import { Users, UserPlus, KeyRound, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';

export default function UserManagement({ users }) {
    const { auth } = usePage().props;
    const currentUser = auth?.user;

    const [selectedUserForReset, setSelectedUserForReset] = useState(null);
    const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
    const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);

    const createForm = useForm({
        nama: '',
        nip: '',
        email: '',
        role: 'pengamat',
        password: '',
    });

    const editForm = useForm({
        nama: '',
        nip: '',
        email: '',
        role: 'pengamat',
        password: '',
    });

    const resetForm = useForm({
        password: '',
    });

    const deleteForm = useForm({});

    const handleCreateUser = (e) => {
        e.preventDefault();
        createForm.post(route('admin.users.store'), {
            onSuccess: () => createForm.reset(),
        });
    };

    const handleOpenEditModal = (user) => {
        setSelectedUserForEdit(user);
        editForm.setData({
            nama: user.nama,
            nip: user.nip,
            email: user.email || '',
            role: user.role,
            password: '',
        });
    };

    const handleUpdateUser = (e) => {
        e.preventDefault();
        editForm.put(route('admin.users.update', selectedUserForEdit.id), {
            onSuccess: () => {
                setSelectedUserForEdit(null);
                editForm.reset();
            }
        });
    };

    const handleDeleteUser = (e) => {
        e.preventDefault();
        deleteForm.delete(route('admin.users.destroy', selectedUserForDelete.id), {
            onSuccess: () => setSelectedUserForDelete(null),
        });
    };

    const handleResetPassword = (e) => {
        e.preventDefault();
        resetForm.post(route('admin.users.reset-password', selectedUserForReset.id), {
            onSuccess: () => {
                setSelectedUserForReset(null);
                resetForm.reset();
            }
        });
    };

    const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs placeholder:text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 transition outline-none font-medium";

    return (
        <Sidebar>
            <Head title="Kelola Pengguna - SILAP-Kinerja" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Kelola Akun Pengguna</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Manajemen data pegawai, peran akun, dan kata sandi pengguna BMKG Staklim Jateng.</p>
                </div>

                {/* Create New User Card */}
                <div className="bg-white border border-sky-100/80 rounded-2xl p-5 shadow-sm shadow-sky-100/30">
                    <h2 className="font-semibold text-sm text-slate-900 border-b border-sky-100 pb-3 mb-4 flex items-center space-x-2">
                        <UserPlus className="w-4 h-4 text-sky-600" />
                        <span>Tambah Akun Pegawai Baru</span>
                    </h2>

                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                            <input
                                type="text"
                                value={createForm.data.nama}
                                onChange={(e) => createForm.setData('nama', e.target.value)}
                                className={inputClass}
                                placeholder="Nama Pegawai"
                                required
                            />
                            {createForm.errors.nama && <p className="text-rose-600 text-[11px] mt-1 font-medium">{createForm.errors.nama}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">NIP</label>
                            <input
                                type="text"
                                value={createForm.data.nip}
                                onChange={(e) => createForm.setData('nip', e.target.value)}
                                className={inputClass}
                                placeholder="Nomor Induk Pegawai"
                                required
                            />
                            {createForm.errors.nip && <p className="text-rose-600 text-[11px] mt-1 font-medium">{createForm.errors.nip}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Opsional)</label>
                            <input
                                type="email"
                                value={createForm.data.email}
                                onChange={(e) => createForm.setData('email', e.target.value)}
                                className={inputClass}
                                placeholder="nama@bmkg.go.id"
                            />
                            {createForm.errors.email && <p className="text-rose-600 text-[11px] mt-1 font-medium">{createForm.errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Role Jabatan</label>
                            <select
                                value={createForm.data.role}
                                onChange={(e) => createForm.setData('role', e.target.value)}
                                className={inputClass}
                            >
                                <option value="pengamat">Pengamat</option>
                                <option value="penyelia">Penyelia</option>
                                <option value="admin">Admin</option>
                            </select>
                            {createForm.errors.role && <p className="text-rose-600 text-[11px] mt-1 font-medium">{createForm.errors.role}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Password Awal</label>
                            <input
                                type="password"
                                value={createForm.data.password}
                                onChange={(e) => createForm.setData('password', e.target.value)}
                                className={inputClass}
                                placeholder="Min 6 karakter"
                                required
                            />
                            {createForm.errors.password && <p className="text-rose-600 text-[11px] mt-1 font-medium">{createForm.errors.password}</p>}
                        </div>

                        <div className="md:col-span-5 flex justify-end mt-2">
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition shadow-sm shadow-sky-600/20 disabled:opacity-50 cursor-pointer"
                            >
                                Buat Akun &amp; Wajibkan Ganti Password
                            </button>
                        </div>
                    </form>
                </div>

                {/* Users List Table */}
                <div className="bg-white border border-sky-100/80 rounded-2xl overflow-hidden shadow-sm shadow-sky-100/30">
                    <div className="px-6 py-4 border-b border-sky-100 font-bold text-sm text-slate-900 bg-sky-50/70 flex items-center justify-between">
                        <span>Daftar Akun Pengguna Terdaftar ({users.length} Akun)</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-sky-50/70 text-slate-900 uppercase font-bold text-[11px] tracking-wider border-b border-sky-100">
                                <tr>
                                    <th className="px-5 py-4">Nama Pegawai</th>
                                    <th className="px-5 py-4">NIP</th>
                                    <th className="px-5 py-4">Email</th>
                                    <th className="px-5 py-4">Role Jabatan</th>
                                    <th className="px-5 py-4">Status Password</th>
                                    <th className="px-5 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sky-50">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-sky-50/40 transition">
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-slate-900">{u.nama}</div>
                                        </td>
                                        <td className="px-5 py-4 font-medium text-slate-600">{u.nip}</td>
                                        <td className="px-5 py-4 text-slate-600">{u.email || '-'}</td>
                                        <td className="px-5 py-4 uppercase font-bold text-sky-700">{u.role}</td>
                                        <td className="px-5 py-4">
                                            {u.must_change_password ? (
                                                <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                                                    Wajib Ganti Password
                                                </span>
                                            ) : (
                                                <span className="text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                                                    Aktif &amp; Terverifikasi
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditModal(u)}
                                                    className="p-1 text-sky-600 hover:text-sky-800 hover:scale-110 transition cursor-pointer"
                                                    title="Edit Data Pengguna"
                                                >
                                                    <Pencil className="w-4 h-4" strokeWidth={2.5} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedUserForReset(u)}
                                                    className="p-1 text-amber-600 hover:text-amber-700 hover:scale-110 transition cursor-pointer"
                                                    title="Reset Password Pengguna"
                                                >
                                                    <KeyRound className="w-4 h-4" strokeWidth={2.5} />
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={u.id === currentUser?.id}
                                                    onClick={() => setSelectedUserForDelete(u)}
                                                    className={`p-1 transition ${
                                                        u.id === currentUser?.id
                                                            ? 'text-slate-300 cursor-not-allowed'
                                                            : 'text-rose-600 hover:text-rose-700 hover:scale-110 cursor-pointer'
                                                    }`}
                                                    title={u.id === currentUser?.id ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Pengguna'}
                                                >
                                                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit User Modal */}
                {selectedUserForEdit && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="bg-white border border-sky-100 rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                                <h3 className="font-extrabold text-lg text-slate-900 flex items-center space-x-2">
                                    <Pencil className="w-5 h-5 text-sky-600" />
                                    <span>Edit Data Pengguna</span>
                                </h3>
                                <button
                                    onClick={() => setSelectedUserForEdit(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={editForm.data.nama}
                                        onChange={(e) => editForm.setData('nama', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                    {editForm.errors.nama && <p className="text-rose-600 text-[11px] mt-1 font-medium">{editForm.errors.nama}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">NIP</label>
                                    <input
                                        type="text"
                                        value={editForm.data.nip}
                                        onChange={(e) => editForm.setData('nip', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                    {editForm.errors.nip && <p className="text-rose-600 text-[11px] mt-1 font-medium">{editForm.errors.nip}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Opsional)</label>
                                    <input
                                        type="email"
                                        value={editForm.data.email}
                                        onChange={(e) => editForm.setData('email', e.target.value)}
                                        className={inputClass}
                                        placeholder="nama@bmkg.go.id"
                                    />
                                    {editForm.errors.email && <p className="text-rose-600 text-[11px] mt-1 font-medium">{editForm.errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Role Jabatan</label>
                                    <select
                                        value={editForm.data.role}
                                        onChange={(e) => editForm.setData('role', e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="pengamat">Pengamat</option>
                                        <option value="penyelia">Penyelia</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    {editForm.errors.role && <p className="text-rose-600 text-[11px] mt-1 font-medium">{editForm.errors.role}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Password Baru (Opsional)
                                    </label>
                                    <input
                                        type="password"
                                        value={editForm.data.password}
                                        onChange={(e) => editForm.setData('password', e.target.value)}
                                        className={inputClass}
                                        placeholder="Biarkan kosong jika tidak diubah"
                                    />
                                    {editForm.errors.password && <p className="text-rose-600 text-[11px] mt-1 font-medium">{editForm.errors.password}</p>}
                                </div>

                                <div className="flex justify-end space-x-3 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUserForEdit(null)}
                                        className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-sm shadow-sky-600/20"
                                    >
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Reset Password Modal */}
                {selectedUserForReset && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="bg-white border border-sky-100 rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h3 className="font-extrabold text-lg text-slate-900 mb-1">Reset Password Pengguna</h3>
                            <p className="text-xs text-slate-600 mb-4">
                                Pegawai: <strong className="text-slate-900">{selectedUserForReset.nama}</strong> (NIP: {selectedUserForReset.nip})
                            </p>
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password Baru</label>
                                    <input
                                        type="password"
                                        value={resetForm.data.password}
                                        onChange={(e) => resetForm.setData('password', e.target.value)}
                                        className={inputClass}
                                        placeholder="Ketik password baru"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUserForReset(null)}
                                        className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={resetForm.processing}
                                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm shadow-amber-600/20"
                                    >
                                        Reset &amp; Paksa Ganti Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Confirm Delete Modal */}
                {selectedUserForDelete && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="bg-white border border-rose-100 rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <div className="flex items-center space-x-3 text-rose-600 mb-3">
                                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-lg text-slate-900 leading-tight">Hapus Akun Pengguna</h3>
                                    <p className="text-xs text-rose-600 font-semibold">Tindakan ini tidak dapat dibatalkan.</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                                Apakah Anda yakin ingin menghapus akun pegawai <strong className="text-slate-900">{selectedUserForDelete.nama}</strong> (NIP: {selectedUserForDelete.nip}) dengan role <strong className="uppercase text-sky-700">{selectedUserForDelete.role}</strong>?
                            </p>
                            <form onSubmit={handleDeleteUser} className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedUserForDelete(null)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteForm.processing}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-sm shadow-rose-600/20"
                                >
                                    Ya, Hapus Akun
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </Sidebar>
    );
}
