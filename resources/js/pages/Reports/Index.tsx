import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '../../components/Layout';

interface StatsRow {
    barangay?: string;
    case_category?: string;
    risk_alert?: string;
    count: number;
}

interface ReportsProps {
    barangay_data: StatsRow[];
    case_data: StatsRow[];
    risk_data: StatsRow[];
    visit_summary: {
        completed: number;
        scheduled: number;
        cancelled: number;
    };
}

export default function Index({ barangay_data, case_data, risk_data, visit_summary }: ReportsProps) {
    const totalVisits = visit_summary.completed + visit_summary.scheduled + visit_summary.cancelled;
    const visitSuccessRate = totalVisits > 0 
        ? Math.round((visit_summary.completed / (visit_summary.completed + visit_summary.cancelled || 1)) * 100) 
        : 0;

    // Helper to print report
    const handlePrint = () => {
        window.print();
    };

    // Calculate Barangay maximum count for custom bar scaling
    const maxBarangayCount = barangay_data.length > 0 ? Math.max(...barangay_data.map(d => d.count)) : 10;
    const maxCaseCount = case_data.length > 0 ? Math.max(...case_data.map(d => d.count)) : 10;

    return (
        <Layout>
            <Head title="Outreach Reports & Analytics" />

            <div className="space-y-6 print:space-y-4 print:p-0">
                
                {/* Print Title Block (Only shown when printing) */}
                <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-wide text-center text-slate-900">Community Mental Health Geotagging System</h1>
                    <h2 className="text-sm font-semibold text-center text-slate-500 mt-1">Monthly outreach & Patient Location Analysis Report</h2>
                    <p className="text-xs text-right text-slate-400 mt-4">Report Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                {/* Dashboard Action Header */}
                <div className="flex justify-between items-center print:hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Statistical Outreach Analysis</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Review aggregated barangay counts, case distributions, and outreach visit ratios.</p>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition hover:scale-105 flex items-center gap-2"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Export Print PDF
                    </button>
                </div>

                {/* Main analytics panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Barangay Distribution - Premium SVG Bar Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 print:border-none print:shadow-none">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-6 uppercase tracking-wider text-teal-600 dark:text-teal-400 border-b border-slate-50 dark:border-slate-800/80 pb-2">
                            Patient Density per Barangay
                        </h4>

                        {barangay_data.length === 0 ? (
                            <p className="text-xs text-slate-400 py-12 text-center">No patient address records available to chart.</p>
                        ) : (
                            <div className="space-y-5">
                                {/* Customized SVG Vertical Bar Chart */}
                                <div className="h-64 w-full">
                                    <svg className="w-full h-full" viewBox="0 0 500 240" preserveAspectRatio="none">
                                        {/* Gradients */}
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#0d9488" />
                                                <stop offset="100%" stopColor="#0f766e" />
                                            </linearGradient>
                                        </defs>

                                        {/* Grid lines */}
                                        <line x1="40" y1="40" x2="480" y2="40" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                                        <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                                        <line x1="40" y1="160" x2="480" y2="160" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                                        <line x1="40" y1="210" x2="480" y2="210" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-700" />

                                        {/* Bars */}
                                        {barangay_data.map((d, index) => {
                                            const barWidth = 35;
                                            const gap = (400 - (barangay_data.length * barWidth)) / (barangay_data.length + 1);
                                            const x = 50 + index * (barWidth + gap);
                                            
                                            // Scale height
                                            const scaleFactor = 160 / maxBarangayCount;
                                            const barHeight = d.count * scaleFactor;
                                            const y = 210 - barHeight;

                                            return (
                                                <g key={d.barangay} className="group cursor-pointer">
                                                    {/* Bar rect */}
                                                    <rect
                                                        x={x}
                                                        y={y}
                                                        width={barWidth}
                                                        height={barHeight}
                                                        rx="6"
                                                        fill="url(#barGradient)"
                                                        className="transition-all duration-300 hover:opacity-90"
                                                    />
                                                    {/* Value label on hover */}
                                                    <text
                                                        x={x + barWidth / 2}
                                                        y={y - 8}
                                                        textAnchor="middle"
                                                        className="text-[10px] font-bold fill-slate-700 dark:fill-slate-350"
                                                    >
                                                        {d.count}
                                                    </text>
                                                    {/* Barangay Name */}
                                                    <text
                                                        x={x + barWidth / 2}
                                                        y="228"
                                                        textAnchor="middle"
                                                        className="text-[9px] font-bold fill-slate-400 dark:fill-slate-500"
                                                    >
                                                        {d.barangay?.substring(0, 7) || 'Brgy'}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>
                                <p className="text-[10px] text-slate-400 text-center italic mt-2">Charts indicate demographic distribution of patients by barangay address.</p>
                            </div>
                        )}
                    </div>

                    {/* Visit outreach stats summary */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 print:border-none print:shadow-none">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-6 uppercase tracking-wider text-teal-600 dark:text-teal-400 border-b border-slate-50 dark:border-slate-800/80 pb-2">
                            Outreach Agenda Metrics
                        </h4>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{visit_summary.completed}</span>
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mt-0.5">Visits Completed</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">{visitSuccessRate}%</span>
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mt-0.5">Success Ratio</span>
                                </div>
                            </div>

                            {/* Custom Circular Progress Donut Chart */}
                            <div className="flex justify-center py-2">
                                <div className="relative h-32 w-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-slate-100 dark:text-slate-800"
                                            stroke="currentColor"
                                            strokeWidth="3.5"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="text-teal-600 dark:text-teal-400"
                                            strokeDasharray={`${visitSuccessRate}, 100`}
                                            stroke="currentColor"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-xs text-slate-400 font-semibold uppercase">Total Visits</span>
                                        <span className="text-lg font-bold text-slate-800 dark:text-white">{totalVisits}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-400 font-semibold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed Visits</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{visit_summary.completed}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 font-semibold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Pending Agenda</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{visit_summary.scheduled}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 font-semibold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400" /> Cancelled Visits</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{visit_summary.cancelled}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Case Categories & Risk Alerts split grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Case Categories Ratios */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 print:border-none print:shadow-none">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-6 uppercase tracking-wider text-teal-600 dark:text-teal-400 border-b border-slate-50 dark:border-slate-800/80 pb-2">
                            Mental Health Categories
                        </h4>

                        {case_data.length === 0 ? (
                            <p className="text-xs text-slate-400 py-6 text-center">No categories registered.</p>
                        ) : (
                            <div className="space-y-4">
                                {case_data.map(d => {
                                    const percent = maxCaseCount > 0 ? Math.round((d.count / maxCaseCount) * 100) : 0;
                                    return (
                                        <div key={d.case_category} className="text-xs">
                                            <div className="flex justify-between mb-1.5 font-semibold">
                                                <span className="text-slate-600 dark:text-slate-350">{d.case_category}</span>
                                                <span className="text-slate-800 dark:text-white font-bold">{d.count} patients</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-teal-600 dark:bg-teal-450 h-full rounded-full transition-all duration-500" 
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Risk alerts breakdown */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 print:border-none print:shadow-none">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-6 uppercase tracking-wider text-teal-600 dark:text-teal-400 border-b border-slate-50 dark:border-slate-800/80 pb-2">
                            Clinical Risk Classification
                        </h4>

                        {risk_data.length === 0 ? (
                            <p className="text-xs text-slate-400 py-6 text-center">No risk alerts classified.</p>
                        ) : (
                            <div className="space-y-4">
                                {['High', 'Medium', 'Low'].map(level => {
                                    const item = risk_data.find(r => r.risk_alert === level);
                                    const count = item ? item.count : 0;
                                    const total = risk_data.reduce((sum, current) => sum + current.count, 0);
                                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;

                                    const getColor = (lvl: string) => {
                                        if (lvl === 'High') return 'bg-rose-500';
                                        if (lvl === 'Medium') return 'bg-orange-500';
                                        return 'bg-emerald-500';
                                    };

                                    return (
                                        <div key={level} className="text-xs">
                                            <div className="flex justify-between mb-1.5 font-semibold">
                                                <span className="text-slate-600 dark:text-slate-350">{level} Severity Risk</span>
                                                <span className="text-slate-800 dark:text-white font-bold">{count} ({percent}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className={`${getColor(level)} h-full rounded-full transition-all duration-500`} 
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Print Sign-off block (Only visible on PDF exports) */}
                <div className="hidden print:flex justify-between pt-16 mt-16 border-t border-slate-300 text-xs">
                    <div>
                        <div className="border-b border-slate-800 w-48 pb-1 text-center font-bold">Health Officer Signature</div>
                        <span className="block text-slate-400 mt-1 text-center">Date Signed</span>
                    </div>
                    <div>
                        <div className="border-b border-slate-800 w-48 pb-1 text-center font-bold">Barangay Coordinator</div>
                        <span className="block text-slate-400 mt-1 text-center">Date Signed</span>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
