import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../components/Layout';

interface Patient {
    id: number;
    patient_id: string;
    full_name: string;
    age: number;
    sex: string;
    contact_number: string;
    barangay: string;
    case_category: string;
    status: string;
    risk_alert: string;
    latitude: number | null;
    longitude: number | null;
}

interface IndexProps {
    patients: Patient[];
    barangays: string[];
    filters: {
        search?: string;
        barangay?: string;
        status?: string;
        case_category?: string;
        risk_alert?: string;
    };
}

export default function Index({ patients, barangays, filters }: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [barangay, setBarangay] = useState(filters.barangay || '');
    const [status, setStatus] = useState(filters.status || '');
    const [category, setCategory] = useState(filters.case_category || '');
    const [risk, setRisk] = useState(filters.risk_alert || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/patients', {
            search,
            barangay,
            status,
            case_category: category,
            risk_alert: risk
        }, { preserveState: true });
    };

    const handleClear = () => {
        setSearch('');
        setBarangay('');
        setStatus('');
        setCategory('');
        setRisk('');
        router.get('/patients');
    };

    const getRiskBadge = (risk: string) => {
        switch (risk) {
            case 'High':
                return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50';
            case 'Medium':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50';
            default:
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20';
            case 'Recovered':
                return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20';
            default:
                return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20';
        }
    };

    return (
        <Layout>
            <Head title="Patient Directory" />

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Patient Roster</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Search patient records, address details, health severity alerts, and geotag status.</p>
                    </div>
                    <Link
                        href="/patients/create"
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition-all duration-200 hover:scale-[1.02] shrink-0 text-center"
                    >
                        Register New Patient
                    </Link>
                </div>

                {/* Filters Row */}
                <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pb-6 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="lg:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Search Keywords</label>
                        <input
                            type="text"
                            placeholder="Patient name or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Barangay</label>
                        <select
                            value={barangay}
                            onChange={(e) => setBarangay(e.target.value)}
                            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="">All Barangays</option>
                            {barangays.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Case Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="">All Categories</option>
                            <option value="Schizophrenia">Schizophrenia</option>
                            <option value="Bipolar Disorder">Bipolar Disorder</option>
                            <option value="Depression">Depression</option>
                            <option value="Anxiety Disorder">Anxiety Disorder</option>
                            <option value="ADHD">ADHD</option>
                            <option value="PTSD">PTSD</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Risk Alert</label>
                        <select
                            value={risk}
                            onChange={(e) => setRisk(e.target.value)}
                            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="">All Risks</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            type="submit"
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-lg transition"
                        >
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold p-2 rounded-lg transition"
                            title="Reset filters"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6.89M9 11l3-3 3 3m-3-3v12" />
                            </svg>
                        </button>
                    </div>
                </form>

                {/* Patient Table */}
                <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                <th className="py-3 px-4">Patient ID</th>
                                <th className="py-3 px-4">Name</th>
                                <th className="py-3 px-4">Age/Sex</th>
                                <th className="py-3 px-4">Address</th>
                                <th className="py-3 px-4">Case Category</th>
                                <th className="py-3 px-4">Risk</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Geotag</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {patients.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                                        No patient records found.
                                    </td>
                                </tr>
                            ) : (
                                patients.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="py-3.5 px-4 font-semibold text-xs text-slate-500 dark:text-slate-400">
                                            {p.patient_id}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                                            {p.full_name}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs">
                                            {p.age} yrs / {p.sex}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs">
                                            <span className="font-semibold">{p.barangay}</span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {p.case_category}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getRiskBadge(p.risk_alert)}`}>
                                                {p.risk_alert}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(p.status)}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs">
                                            {p.latitude && p.longitude ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Geotagged
                                                </span>
                                            ) : (
                                                <span className="text-amber-500 font-bold flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Unmapped
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right text-xs space-x-2 shrink-0 whitespace-nowrap">
                                            <Link
                                                href={`/patients/${p.id}`}
                                                className="text-teal-600 hover:text-teal-700 dark:text-teal-400 font-bold"
                                            >
                                                View
                                            </Link>
                                            <span className="text-slate-200 dark:text-slate-700">|</span>
                                            <Link
                                                href={`/patients/${p.id}/edit`}
                                                className="text-slate-600 hover:text-slate-700 dark:text-slate-300 font-semibold"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
