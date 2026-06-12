import React from 'react';
import { Link } from '@inertiajs/react';

interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
}

interface SidebarProps {
    navItems: NavItem[];
    isActive: (path: string) => boolean;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export default function Sidebar({ navItems, isActive, isCollapsed, onToggleCollapse }: SidebarProps) {
    return (
        <aside
            className={`hidden md:flex flex-col bg-white border-r border-slate-200 shadow-sm z-30 transition-all duration-300 ease-in-out select-none shrink-0 overflow-x-hidden ${
                isCollapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* Sidebar Header / Branding (Click to expand when collapsed) */}
            <div 
                onClick={isCollapsed ? onToggleCollapse : undefined}
                className={`flex items-center justify-between px-4 h-16 border-b border-slate-200 overflow-hidden relative group/header transition-colors ${
                    isCollapsed ? 'cursor-pointer hover:bg-slate-50' : ''
                }`}
                title={isCollapsed ? "Expand Sidebar" : undefined}
            >
                <div className="flex items-center gap-3 min-w-max">
                    {/* Logo container with hover chevron overlay */}
                    <div className="relative h-10 w-10 shrink-0">
                        {/* Logo Icon */}
                        <div className={`absolute inset-0 flex items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20 transition-all duration-250 ${
                            isCollapsed ? 'group-hover/header:opacity-0 group-hover/header:scale-75' : ''
                        }`}>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        
                        {/* Expand Chevron (Fades and scales in when hovered in collapsed state) */}
                        {isCollapsed && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200 opacity-0 group-hover/header:opacity-100 scale-50 group-hover/header:scale-100 transition-all duration-250">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                    
                    {/* Branding Titles (hidden when collapsed) */}
                    <div className={`transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 pointer-events-none absolute' : 'w-auto opacity-100'}`}>
                        <h1 className="font-bold text-xs uppercase tracking-wider text-teal-600 whitespace-nowrap">SCMH-GFVMS</h1>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Field Visit System</span>
                    </div>
                </div>

                {/* Collapse Toggle Button (visible only when expanded) */}
                {!isCollapsed && (
                    <button
                        onClick={onToggleCollapse}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition shrink-0"
                        title="Collapse Sidebar"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.path}
                        className={`group relative flex items-center gap-3 px-3.5 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                            isActive(item.path)
                                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/10'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <div className="shrink-0">{item.icon}</div>
                        
                        {/* Hide text when collapsed */}
                        <span
                            className={`transition-all duration-300 whitespace-nowrap ${
                                isCollapsed 
                                    ? 'w-0 opacity-0 pointer-events-none absolute' 
                                    : 'opacity-100'
                            }`}
                        >
                            {item.name}
                        </span>

                        {/* Collapsed Tooltip */}
                        {isCollapsed && (
                            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50">
                                {item.name}
                                {/* Tooltip Caret */}
                                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900"></div>
                            </div>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Sidebar Bottom Footer Control Actions */}
            <div className="p-4 border-t border-slate-200 flex flex-col gap-2">
                {/* Sign Out Button */}
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    type="button"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition group relative ${
                        isCollapsed ? 'justify-center' : ''
                    }`}
                >
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    
                    <span
                        className={`transition-all duration-300 whitespace-nowrap ${
                            isCollapsed ? 'w-0 opacity-0 pointer-events-none absolute' : 'opacity-100'
                        }`}
                    >
                        Sign Out
                    </span>

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                        <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-rose-600 text-white text-[11px] font-bold rounded-lg shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50">
                            Sign Out
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-rose-600"></div>
                        </div>
                    )}
                </Link>
            </div>
        </aside>
    );
}
