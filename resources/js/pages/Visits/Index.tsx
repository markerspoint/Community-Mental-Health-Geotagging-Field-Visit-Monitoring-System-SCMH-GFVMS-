import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import Layout from '../../components/Layout';
import { getOfflineMode, queueOfflineVisit, getOfflinePatients } from '../../lib/offlineStore';

interface PatientOption {
    id: number | string;
    patient_id: string;
    full_name: string;
    barangay: string;
}

interface Visit {
    id: number | string;
    patient_id: number | string;
    scheduled_date: string;
    visit_status: string;
    check_in_time: string | null;
    check_out_time: string | null;
    notes: string | null;
    medications_provided: string | null;
    follow_up_date: string | null;
    staff_name: string;
    patient?: {
        full_name: string;
        barangay: string;
    };
    isOffline?: boolean;
}

interface IndexProps {
    visits: Visit[];
    patients: PatientOption[];
    filters: {
        status?: string;
        timeframe?: string;
    };
}

export default function Index({ visits: serverVisits, patients: serverPatients, filters }: IndexProps) {
    const isOfflineMode = getOfflineMode();
    const [timeframe, setTimeframe] = useState(filters.timeframe || '');
    const [status, setStatus] = useState(filters.status || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allVisits, setAllVisits] = useState<Visit[]>([]);
    const [allPatients, setAllPatients] = useState<PatientOption[]>([]);
    const [offlineSuccess, setOfflineSuccess] = useState(false);

    // Schedule form hook
    const { data, setData, post, reset, errors, processing } = useForm({
        patient_id: '',
        scheduled_date: '',
        staff_name: '',
    });

    // Load server and offline cached elements
    useEffect(() => {
        // Load visits
        const offlineVisits = JSON.parse(localStorage.getItem('scm_offline_visits') || '[]').map((ov: any) => {
            // Find patient name from server patients or local offline patients
            const localPts = getOfflinePatients();
            const pt = serverPatients.find(p => p.id === ov.patient_id) || localPts.find(p => p.id === ov.patient_id);
            return {
                id: ov.id,
                patient_id: ov.patient_id,
                scheduled_date: ov.scheduled_date,
                visit_status: ov.visit_status,
                check_in_time: ov.check_in_time ?? null,
                check_out_time: ov.check_out_time ?? null,
                notes: ov.notes ?? null,
                medications_provided: ov.medications_provided ?? null,
                follow_up_date: ov.follow_up_date ?? null,
                staff_name: ov.staff_name,
                patient: pt ? { full_name: pt.full_name, barangay: pt.barangay } : { full_name: 'Unknown Patient', barangay: 'Unknown' },
                isOffline: true
            };
        });

        setAllVisits([...offlineVisits, ...serverVisits]);

        // Load patients for dropdown options
        const localPts = getOfflinePatients().map(op => ({
            id: op.id,
            patient_id: 'Offline Draft',
            full_name: `${op.full_name} (Offline Cache)`,
            barangay: op.barangay
        }));
        setAllPatients([...localPts, ...serverPatients]);
    }, [serverVisits, serverPatients]);

    const handleFilter = (selectedTimeframe: string) => {
        setTimeframe(selectedTimeframe);
        router.get('/visits', {
            timeframe: selectedTimeframe,
            status
        }, { preserveState: true });
    };

    const handleStatusFilter = (selectedStatus: string) => {
        setStatus(selectedStatus);
        router.get('/visits', {
            timeframe,
            status: selectedStatus
        }, { preserveState: true });
    };

    const handleSchedule = (e: React.FormEvent) => {
        e.preventDefault();

        if (isOfflineMode) {
            queueOfflineVisit({
                patient_id: data.patient_id,
                scheduled_date: data.scheduled_date,
                visit_status: 'Scheduled',
                staff_name: data.staff_name
            });
            
            setOfflineSuccess(true);
            setIsModalOpen(false);
            reset();
            
            // Reload page states locally
            setTimeout(() => {
                setOfflineSuccess(false);
                window.location.reload();
            }, 1500);
            return;
        }

        // Online mode scheduling
        post('/visits', {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            }
        });
    };

    const handleCancelVisit = (id: number | string) => {
        if (confirm('Are you sure you want to cancel this scheduled visit?')) {
            router.delete(`/visits/${id}`);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50';
            case 'Active': return 'bg-teal-500 text-white animate-pulse shadow-md shadow-teal-500/20';
            case 'Cancelled': return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
            default: return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50';
        }
    };

    return (
        <Layout>
            <Head title="Field Visit Monitoring" />

            {offlineSuccess && (
                <div className="mb-6 p-4 bg-emerald-500 text-white rounded-2xl font-semibold text-center animate-bounce shadow-md">
                    Visit scheduled offline! Saved to local cache.
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Field Visit Monitoring logs</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Plan visits, manage check-ins at locations, and review follow-up timelines.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition hover:scale-[1.02] text-center"
                    >
                        Schedule Field Visit
                    </button>
                </div>

                {/* Filters Tab Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-6">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {[
                            { label: 'All Agenda', value: '' },
                            { label: 'Today', value: 'today' },
                            { label: 'Upcoming', value: 'upcoming' },
                            { label: 'Past', value: 'past' },
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => handleFilter(tab.value)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                    timeframe === tab.value
                                        ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={status}
                            onChange={(e) => handleStatusFilter(e.target.value)}
                            className="text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Active">Active / In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Visits List */}
                <div className="space-y-4">
                    {allVisits.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                            No visits scheduled matching the filters.
                        </div>
                    ) : (
                        allVisits.map((visit) => {
                            const isScheduled = visit.visit_status === 'Scheduled';
                            const isActive = visit.visit_status === 'Active';
                            const isCompleted = visit.visit_status === 'Completed';

                            return (
                                <div
                                    key={visit.id}
                                    className={`p-5 rounded-2xl border transition-all ${
                                        isActive ? 'border-teal-500 bg-teal-50/10 dark:bg-teal-950/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm shrink-0">
                                                {visit.patient?.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                                                    {visit.patient?.full_name}
                                                </h4>
                                                <span className="text-xs text-slate-400 block mt-0.5">{visit.patient?.barangay} • Assigned Staff: {visit.staff_name}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 ml-14 sm:ml-0">
                                            <div className="text-right">
                                                <span className="text-xs font-bold block text-slate-700 dark:text-slate-200">
                                                    {new Date(visit.scheduled_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                <span className="text-[10px] text-slate-400 block mt-0.5">Date Scheduled</span>
                                            </div>

                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${getStatusBadge(visit.visit_status)}`}>
                                                {visit.isOffline ? 'Offline' : visit.visit_status}
                                            </span>

                                            <div className="flex gap-2">
                                                {(isScheduled || isActive) && (
                                                    <Link
                                                        href={`/visits/${visit.id}/active`}
                                                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-500/10 transition hover:scale-105"
                                                    >
                                                        {isActive ? 'Resume Visit' : 'Start Check-In'}
                                                    </Link>
                                                )}
                                                {isScheduled && !visit.isOffline && (
                                                    <button
                                                        onClick={() => handleCancelVisit(visit.id)}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg border border-transparent hover:border-rose-100 transition"
                                                        title="Cancel Visit"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Completed logs details box */}
                                    {isCompleted && (
                                        <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs pl-14">
                                            <div>
                                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Visit Logs</span>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">Checked In: {new Date(visit.check_in_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">Checked Out: {new Date(visit.check_out_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            {visit.notes && (
                                                <div className="md:col-span-2">
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Observations & notes</span>
                                                    <p className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100/50 dark:border-slate-800/60 text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{visit.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Schedule Visit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden animate-scale-up" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-base text-slate-800 dark:text-white">Schedule Outreach Visit</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSchedule} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Select Patient</label>
                                <select
                                    required
                                    value={data.patient_id}
                                    onChange={(e) => setData('patient_id', e.target.value)}
                                    className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="">-- Choose Patient --</option>
                                    {allPatients.map(p => (
                                        <option key={p.id} value={p.id}>{p.full_name} ({p.barangay})</option>
                                    ))}
                                </select>
                                {errors.patient_id && <span className="text-red-500 text-[10px]">{errors.patient_id}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Scheduled Date</label>
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={data.scheduled_date}
                                    onChange={(e) => setData('scheduled_date', e.target.value)}
                                    className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                />
                                {errors.scheduled_date && <span className="text-red-500 text-[10px]">{errors.scheduled_date}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Assigned Health Staff Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Doctor, Nurse, or BHW name"
                                    value={data.staff_name}
                                    onChange={(e) => setData('staff_name', e.target.value)}
                                    className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                />
                                {errors.staff_name && <span className="text-red-500 text-[10px]">{errors.staff_name}</span>}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 shadow-md shadow-teal-500/10 transition"
                                >
                                    Schedule Visit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
