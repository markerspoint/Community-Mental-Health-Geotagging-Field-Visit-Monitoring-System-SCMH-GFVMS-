import React, { useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';

interface LoginProps {
    isEmptyDb: boolean;
}

export default function Login({ isEmptyDb }: LoginProps) {
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);

    const { data, setData, post, errors, processing } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-800 transition-colors duration-200">
            <Head title="Sign In" />

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-none">
                
                {/* Left Side: System Branding & Welcome (Hidden on Mobile) */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-teal-700 text-white relative overflow-hidden">
                    {/* Background SVG Decorator */}
                    <svg className="absolute inset-0 h-full w-full opacity-10" fill="none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />
                        <path d="M10 50 C 30 20, 70 80, 90 50" stroke="currentColor" strokeWidth="1" />
                    </svg>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-700 shadow-md">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <span className="font-extrabold text-base tracking-wider">SCMH-GFVMS</span>
                    </div>

                    <div className="space-y-6 relative z-10 max-w-md">
                        <h2 className="text-3xl font-extrabold leading-tight">
                            Community Mental Health Geotagging & Field Visit Monitoring System
                        </h2>
                        <p className="text-sm text-teal-100 font-medium leading-relaxed">
                            A specialized web-geotagging and mobile outreach terminal for Sipalay City's mental health personnel. Pin patient households, schedule follow-ups, and track field visits.
                        </p>
                    </div>

                    <div className="text-xs text-teal-200 relative z-10">
                        &copy; 2026 Sipalay City Health Office. All rights reserved.
                    </div>
                </div>

                {/* Right Side: Login Form Card */}
                <div className="flex items-center justify-center p-6 sm:p-12">
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-left">
                            <div className="lg:hidden flex items-center gap-2 mb-6">
                                <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                </div>
                                <span className="font-extrabold text-sm text-teal-700">SCMH-GFVMS</span>
                            </div>
                            
                            <h3 className="text-2xl font-extrabold text-slate-800">Account Sign In</h3>
                            <p className="text-xs text-slate-400 mt-1.5 font-medium">
                                Please sign in to access patient registries, active check-in logs, and reports.
                            </p>
                        </div>


                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full text-xs rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                                />
                                {errors.email && <span className="text-red-500 text-[10px] mt-1 block font-medium">{errors.email}</span>}
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full text-xs rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                                />
                                {errors.password && <span className="text-red-500 text-[10px] mt-1 block font-medium">{errors.password}</span>}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                                    />
                                    <span className="text-xs text-slate-500 font-medium">Keep me signed in</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-500/25 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 text-xs"
                            >
                                {processing ? 'Signing In...' : 'SIGN IN'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
