import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { getOfflineMode, getPendingCount, setManualOfflineMode, syncOfflineData } from '../lib/offlineStore';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const { url } = usePage();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Initialize Theme, Offline status and Event Listeners
    useEffect(() => {
        // Force light mode
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');

        // Offline Mode
        setIsOffline(getOfflineMode());
        setPendingCount(getPendingCount());

        const handleOfflineChange = () => {
            setIsOffline(getOfflineMode());
        };

        const handleQueueChange = () => {
            setPendingCount(getPendingCount());
        };

        window.addEventListener('offline-mode-change', handleOfflineChange);
        window.addEventListener('offline-queue-change', handleQueueChange);
        window.addEventListener('online', handleOfflineChange);
        window.addEventListener('offline', handleOfflineChange);

        return () => {
            window.removeEventListener('offline-mode-change', handleOfflineChange);
            window.removeEventListener('offline-queue-change', handleQueueChange);
            window.removeEventListener('online', handleOfflineChange);
            window.removeEventListener('offline', handleOfflineChange);
        };
    }, []);



    const toggleOfflineSimulation = () => {
        const nextMode = !isOffline;
        setManualOfflineMode(nextMode);
    };

    const handleSync = async () => {
        if (isSyncing || pendingCount === 0) return;
        setIsSyncing(true);
        setSyncMessage(null);

        const result = await syncOfflineData();
        setIsSyncing(false);
        
        if (result.success) {
            setSyncMessage({
                text: `Successfully synced ${result.patientsCount} patients and ${result.visitsCount} visits!`,
                type: 'success'
            });
            // Reload the Inertia page to update data
            window.location.reload();
        } else {
            setSyncMessage({
                text: `Sync failed: ${result.message}`,
                type: 'error'
            });
        }

        // Clear message after 5 seconds
        setTimeout(() => setSyncMessage(null), 5000);
    };

    const navItems = [
        {
            name: 'Dashboard Map',
            path: '/',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            )
        },
        {
            name: 'Patient Directory',
            path: '/patients',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            name: 'Field Visits',
            path: '/visits',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            name: 'Reports & Analytics',
            path: '/reports',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
            )
        }
    ];

    const isActive = (path: string) => {
        if (path === '/') return url === '/';
        return url.startsWith(path);
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex md:w-64 md:flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm z-30">
                <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">SCMH-GFVMS</h1>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Field Visit System</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                isActive(item.path)
                                    ? 'bg-teal-600 text-white shadow-md shadow-teal-500/10'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    ))}
                </nav>


            </aside>

            {/* Mobile Drawer Navigation */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 shadow-xl flex flex-col z-50 animate-slide-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">M</div>
                                <span className="font-bold text-sm">SCMH-GFVMS</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <nav className="flex-1 px-4 py-6 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                        isActive(item.path)
                                            ? 'bg-teal-600 text-white shadow-md'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {item.icon}
                                    {item.name}
                                </Link>
                            ))}
                        </nav>

                    </aside>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between px-6 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 shadow-sm transition-colors duration-200">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h2 className="hidden md:block text-lg font-semibold tracking-tight text-slate-800 dark:text-white">
                            {navItems.find(item => isActive(item.path))?.name || 'Monitoring System'}
                        </h2>
                    </div>

                    {/* Sync Actions & Connection Stats */}
                    <div className="flex items-center gap-3">
                        {/* Offline simulation switch */}
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                                {isOffline ? 'Offline Sim' : 'Online'}
                            </span>
                            <button
                                onClick={toggleOfflineSimulation}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                    isOffline ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                            >
                                <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                        isOffline ? 'translate-x-4.5' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Sync button */}
                        {pendingCount > 0 && (
                            <button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-bold shadow-md shadow-amber-500/20 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                            >
                                {isSyncing ? (
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6.89M9 11l3-3 3 3m-3-3v12" />
                                    </svg>
                                )}
                                <span>Sync ({pendingCount})</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* Sync notification message banner */}
                {syncMessage && (
                    <div className={`px-6 py-2.5 text-center text-xs font-semibold text-white animate-fade-in z-20 ${
                        syncMessage.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
                    }`}>
                        {syncMessage.text}
                    </div>
                )}

                {/* Offline Simulation Alert Banner */}
                {isOffline && (
                    <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 z-10 font-medium">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span>System is running in Offline Mode. Newly added patients and visits will be saved locally.</span>
                        </div>
                    </div>
                )}

                {/* Sub-view Content */}
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8 transition-colors duration-200">
                    {children}
                </main>
            </div>
        </div>
    );
}
