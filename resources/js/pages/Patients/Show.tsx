import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../components/Layout';
import { Map, Marker } from '../../components/ui/map';

interface Visit {
    id: number;
    scheduled_date: string;
    visit_status: string;
    check_in_time: string | null;
    check_out_time: string | null;
    notes: string | null;
    medications_provided: string | null;
    follow_up_date: string | null;
    staff_name: string;
}

interface Patient {
    id: number;
    patient_id: string;
    full_name: string;
    age: number;
    sex: string;
    contact_number: string;
    emergency_contact: {
        name: string;
        relation: string;
        phone: string;
    };
    barangay: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    case_category: string;
    status: string;
    treatment_status: string | null;
    medication_notes: string | null;
    referral_history: string | null;
    risk_alert: string;
    assigned_staff_name: string | null;
    house_photo_path: string | null;
    field_visits: Visit[];
}

interface ShowProps {
    patient: Patient;
}

export default function Show({ patient }: ShowProps) {
    const handleDelete = () => {
        if (confirm('Are you sure you want to permanently delete this patient record?')) {
            router.delete(`/patients/${patient.id}`);
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'High': return 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/40';
            case 'Medium': return 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400 border-orange-100 dark:border-orange-900/40';
            default: return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'text-teal-700 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 border-teal-100 dark:border-teal-900/40';
            case 'Recovered': return 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40';
            default: return 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/40';
        }
    };

    return (
        <Layout>
            <Head title={`Profile - ${patient.full_name}`} />

            {/* Back Nav bar */}
            <div className="flex items-center justify-between mb-6">
                <Link
                    href="/patients"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Directory
                </Link>
                <div className="flex gap-2">
                    <Link
                        href={`/patients/${patient.id}/edit`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition"
                    >
                        Edit Profile
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200/50 dark:border-rose-900/50 transition"
                    >
                        Delete Record
                    </button>
                </div>
            </div>

            {/* Main profile split layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Left profile summary & photo */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Summary card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 text-center">
                        <div className="h-20 w-20 rounded-full bg-teal-600 text-white font-bold text-3xl mx-auto flex items-center justify-center shadow-lg shadow-teal-500/20">
                            {patient.full_name.charAt(0)}
                        </div>
                        <h3 className="text-lg font-bold mt-4 text-slate-800 dark:text-white">{patient.full_name}</h3>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{patient.patient_id}</span>
                        
                        <div className="flex justify-center gap-2 mt-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRiskColor(patient.risk_alert)}`}>
                                {patient.risk_alert} Severity
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(patient.status)}`}>
                                {patient.status}
                            </span>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 mt-6 pt-4 text-left space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400 font-medium">Age / Sex</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{patient.age} years / {patient.sex}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400 font-medium">Contact</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{patient.contact_number}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400 font-medium">Barangay</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{patient.barangay}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400 font-medium">Assigned Staff</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{patient.assigned_staff_name || 'Unassigned'}</span>
                            </div>
                        </div>
                    </div>

                    {/* House photo consent visual card */}
                    {patient.house_photo_path ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-4">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">House Geotagged Photo</h4>
                            <img
                                src={patient.house_photo_path}
                                alt="Household"
                                className="w-full h-48 object-cover rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner"
                            />
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 text-center text-slate-400">
                            <svg className="h-8 w-8 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs font-semibold">No Household Photo Uploaded</span>
                            <p className="text-[10px] text-slate-400 mt-1">Upload a photo in patient edit screen with patient consent.</p>
                        </div>
                    )}
                </div>

                {/* Right profile detailed sections */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Medical / Treatment details */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">Clinical File details</h4>
                        </div>
                        <div>
                            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Case Category</span>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{patient.case_category}</p>
                        </div>
                        <div>
                            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Emergency Contact</span>
                            <div className="text-sm">
                                <span className="font-bold text-slate-800 dark:text-white">{patient.emergency_contact?.name}</span>
                                <span className="text-slate-400 text-xs ml-1">({patient.emergency_contact?.relation})</span>
                                <span className="block text-slate-500 font-medium text-xs mt-0.5">Phone: {patient.emergency_contact?.phone}</span>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Medication Notes</span>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300 font-medium">
                                {patient.medication_notes || 'No medication notes specified.'}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Treatment Status / Plan</span>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300 font-medium">
                                {patient.treatment_status || 'No treatment plan written.'}
                            </div>
                        </div>
                    </div>

                    {/* Geotag maps locator */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">Household Geotag</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            <div className="space-y-4 md:col-span-1 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium block">Barangay Address</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{patient.barangay}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium block">Street Address</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{patient.address}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium block">Coordinates</span>
                                    {patient.latitude && patient.longitude ? (
                                        <span className="font-semibold text-teal-600 dark:text-teal-400 block mt-0.5">
                                            {patient.latitude}, {patient.longitude}
                                        </span>
                                    ) : (
                                        <span className="font-bold text-amber-500 block mt-0.5">Location Not Geotagged</span>
                                    )}
                                </div>
                            </div>

                            {patient.latitude && patient.longitude ? (
                                <div className="md:col-span-2 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 h-48">
                                    <Map
                                        center={[Number(patient.longitude), Number(patient.latitude)]}
                                        zoom={14}
                                        className="w-full h-full"
                                    >
                                        <Marker
                                            latitude={Number(patient.latitude)}
                                            longitude={Number(patient.longitude)}
                                            color="#0f766e"
                                        />
                                    </Map>
                                </div>
                            ) : (
                                <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 h-48 flex items-center justify-center flex-col text-slate-400">
                                    <span className="text-xs font-semibold">Location Map Unavailable</span>
                                    <Link
                                        href={`/patients/${patient.id}/edit`}
                                        className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
                                    >
                                        Click here to Geotag Patient
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Field visits history list */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">Field Visits Log</h4>
                            <Link
                                href="/visits"
                                className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
                            >
                                Schedule Visit
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {patient.field_visits.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-6">
                                    No outreach field visits registered for this patient.
                                </p>
                            ) : (
                                patient.field_visits.map((visit) => {
                                    const isScheduled = visit.visit_status === 'Scheduled';
                                    const isActive = visit.visit_status === 'Active';
                                    const isCompleted = visit.visit_status === 'Completed';

                                    return (
                                        <div
                                            key={visit.id}
                                            className={`p-4 rounded-2xl border transition-colors ${
                                                isActive ? 'border-teal-500 bg-teal-50/10 dark:bg-teal-950/10' :
                                                isScheduled ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40' :
                                                'border-slate-100 dark:border-slate-800'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                <div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                        {new Date(visit.scheduled_date).toLocaleDateString('en-US', {
                                                            month: 'long',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">Staff: {visit.staff_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                                                        isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                                        isActive ? 'bg-teal-600 text-white animate-pulse' :
                                                        visit.visit_status === 'Cancelled' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' :
                                                        'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                                    }`}>
                                                        {visit.visit_status}
                                                    </span>
                                                    {isScheduled && (
                                                        <Link
                                                            href={`/visits/${visit.id}/active`}
                                                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded-lg transition"
                                                        >
                                                            Start Visit
                                                        </Link>
                                                    )}
                                                    {isActive && (
                                                        <Link
                                                            href={`/visits/${visit.id}/active`}
                                                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition"
                                                        >
                                                            Resume Check-In
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>

                                            {isCompleted && (
                                                <div className="text-xs border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Visit Logs</span>
                                                        <p className="text-slate-500 dark:text-slate-400 font-medium">Checked In: {new Date(visit.check_in_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        <p className="text-slate-500 dark:text-slate-400 font-medium">Checked Out: {new Date(visit.check_out_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                    {visit.notes && (
                                                        <div className="md:col-span-2">
                                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Observations & notes</span>
                                                            <p className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{visit.notes}</p>
                                                        </div>
                                                    )}
                                                    {visit.medications_provided && (
                                                        <div>
                                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Medications Distributed</span>
                                                            <p className="font-bold text-teal-600 dark:text-teal-400">{visit.medications_provided}</p>
                                                        </div>
                                                    )}
                                                    {visit.follow_up_date && (
                                                        <div>
                                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Next Follow-Up Date</span>
                                                            <p className="font-bold text-slate-700 dark:text-slate-200">
                                                                {new Date(visit.follow_up_date).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </p>
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
                </div>
            </div>
        </Layout>
    );
}
