import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Layout from '../../components/Layout';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

interface UsersProps {
    users: User[];
    currentUser: User;
}

export default function Users({ users, currentUser }: UsersProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; userId: number | null }>({
        isOpen: false,
        userId: null
    });
    const [alertModalState, setAlertModalState] = useState<{ isOpen: boolean; message: string }>({
        isOpen: false,
        message: ''
    });

    // User creation form
    const { data, setData, post, reset, errors, processing } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/users', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            }
        });
    };

    const handleDelete = (id: number) => {
        if (id === currentUser.id) {
            setAlertModalState({
                isOpen: true,
                message: 'You cannot delete your own active account.'
            });
            return;
        }

        setDeleteModalState({
            isOpen: true,
            userId: id
        });
    };

    const handleConfirmDelete = () => {
        if (deleteModalState.userId !== null) {
            router.delete(`/users/${deleteModalState.userId}`);
        }
    };

    return (
        <Layout>
            <Head title="User Account Management" />

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 mb-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Staff Account Management</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Manage mental health personnel and Barangay Health Worker accounts.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition hover:scale-[1.02] text-center"
                    >
                        Manually Add User
                    </button>
                </div>

                {/* User List Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                <th className="py-3 px-4">Name</th>
                                <th className="py-3 px-4">Email Address</th>
                                <th className="py-3 px-4">Role/Access</th>
                                <th className="py-3 px-4">Date Registered</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs">
                                            {user.name.charAt(0)}
                                        </div>
                                        {user.name}
                                        {user.id === currentUser.id && (
                                            <span className="text-[9px] bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 px-1.5 py-0.5 rounded font-extrabold">
                                                You
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-350">
                                        {user.email}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                            Health Personnel
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-slate-500">
                                        {new Date(user.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="py-3.5 px-4 text-right text-xs">
                                        {user.id === currentUser.id ? (
                                            <span className="text-slate-300 dark:text-slate-600 italic select-none">Active</span>
                                        ) : (
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-rose-600 hover:text-rose-700 dark:text-rose-450 font-bold transition hover:underline"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manually Add User Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setIsCreateOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden animate-scale-up" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-base text-slate-800 dark:text-white">Manually Add User Account</h3>
                                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Officer name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                />
                                {errors.name && <span className="text-red-500 text-[10px]">{errors.name}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="email@sipalay.gov"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                />
                                {errors.email && <span className="text-red-500 text-[10px]">{errors.email}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Min 6 characters"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                />
                                {errors.password && <span className="text-red-500 text-[10px]">{errors.password}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Re-enter password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 shadow-md shadow-teal-500/10 transition"
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ isOpen: false, userId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Staff Account"
                message="Are you sure you want to permanently delete this staff user account? They will lose all access to the Field Visit Monitoring System."
                confirmText="Delete Account"
                cancelText="Cancel"
                type="danger"
            />

            <ConfirmationModal
                isOpen={alertModalState.isOpen}
                onClose={() => setAlertModalState({ isOpen: false, message: '' })}
                onConfirm={() => setAlertModalState({ isOpen: false, message: '' })}
                title="Action Denied"
                message={alertModalState.message}
                confirmText="OK"
                cancelText=""
                type="danger"
            />
        </Layout>
    );
}
