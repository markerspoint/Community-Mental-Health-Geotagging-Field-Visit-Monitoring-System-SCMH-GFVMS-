import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../components/Layout';
import { Map, Marker, Popup } from '../components/ui/map';
import { getOfflinePatients, OfflinePatient } from '../lib/offlineStore';

interface PatientData {
    id: number | string;
    patient_id: string;
    full_name: string;
    latitude: number | null;
    longitude: number | null;
    barangay: string;
    status: string;
    case_category: string;
    risk_alert: string;
    assigned_staff_name: string | null;
    isOffline?: boolean;
}

interface DashboardProps {
    stats: {
        total_patients: number;
        active_patients: number;
        under_monitoring: number;
        recovered_patients: number;
        high_risk_patients: number;
        today_visits_count: number;
        completed_visits_this_month: number;
    };
    patients: PatientData[];
    filters: {
        barangays: string[];
        case_categories: string[];
        staff_names: string[];
    };
}

export default function Dashboard({ stats, patients: serverPatients, filters: filterOptions }: DashboardProps) {
    const [selectedBarangay, setSelectedBarangay] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedRisk, setSelectedRisk] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
    const [allPatients, setAllPatients] = useState<PatientData[]>([]);
    
    // Map settings
    const [mapCenter, setMapCenter] = useState<[number, number]>([122.4025, 9.7512]);
    const [mapZoom, setMapZoom] = useState(12);

    // Combine server-side patients and offline local patients
    useEffect(() => {
        const offlinePts = getOfflinePatients().map(op => ({
            id: op.id,
            patient_id: 'Offline Draft',
            full_name: op.full_name,
            latitude: op.latitude ?? null,
            longitude: op.longitude ?? null,
            barangay: op.barangay,
            status: op.status,
            case_category: op.case_category,
            risk_alert: op.risk_alert,
            assigned_staff_name: op.assigned_staff_name ?? 'Local Cache',
            isOffline: true
        }));
        
        setAllPatients([...offlinePts, ...serverPatients]);
    }, [serverPatients]);

    // Apply filtering
    const filteredPatients = allPatients.filter(p => {
        const matchesBarangay = !selectedBarangay || p.barangay === selectedBarangay;
        const matchesCategory = !selectedCategory || p.case_category === selectedCategory;
        const matchesRisk = !selectedRisk || p.risk_alert === selectedRisk;
        const matchesStatus = !selectedStatus || p.status === selectedStatus;
        const matchesSearch = !searchQuery || 
            p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barangay.toLowerCase().includes(searchQuery.toLowerCase());
            
        return matchesBarangay && matchesCategory && matchesRisk && matchesStatus && matchesSearch;
    });

    const geotaggedPatients = filteredPatients.filter(p => p.latitude !== null && p.longitude !== null);
    const nonGeotaggedPatients = filteredPatients.filter(p => p.latitude === null || p.longitude === null);

    // Color code based on risk alert level
    const getRiskColor = (risk: string, isOffline?: boolean) => {
        if (isOffline) return 'bg-amber-400 border-dashed border-amber-600';
        switch (risk) {
            case 'High': return 'bg-rose-500 shadow-rose-500/50';
            case 'Medium': return 'bg-orange-500 shadow-orange-500/50';
            default: return 'bg-emerald-500 shadow-emerald-500/50';
        }
    };

    const handleFocusPatient = (p: PatientData) => {
        if (p.latitude && p.longitude) {
            setMapCenter([Number(p.longitude), Number(p.latitude)]);
            setSelectedPatient(p);
        }
    };

    return (
        <Layout>
            <Head title="Interactive Map Dashboard" />
            
            {/* Summary statistics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:gap-6 md:mb-8">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registered</span>
                        <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{stats.total_patients + getOfflinePatients().length}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {getOfflinePatients().length > 0 ? `(+${getOfflinePatients().length} offline)` : 'Synced records'}
                        </p>
                    </div>
                    <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-xl">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Monitoring</span>
                        <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{stats.active_patients + stats.under_monitoring}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">{stats.under_monitoring} under watch</p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Risk Cases</span>
                        <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">{stats.high_risk_patients}</h3>
                        <p className="text-[10px] text-rose-500/80 mt-1 font-semibold">Immediate attention needed</p>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visits Today</span>
                        <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{stats.today_visits_count}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">{stats.completed_visits_this_month} completed this month</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Dashboard Workspace */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Sidebar Filter Panel */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h4 className="font-semibold text-sm mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                            <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filter Patients
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Search Directory</label>
                                <input
                                    type="text"
                                    placeholder="Search name, ID, barangay..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Barangay</label>
                                <select
                                    value={selectedBarangay}
                                    onChange={(e) => setSelectedBarangay(e.target.value)}
                                    className="w-full text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="">All Barangays</option>
                                    {filterOptions.barangays.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Case Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="">All Categories</option>
                                    {filterOptions.case_categories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                    <option value="Schizophrenia">Schizophrenia</option>
                                    <option value="Bipolar Disorder">Bipolar Disorder</option>
                                    <option value="Depression">Depression</option>
                                    <option value="Anxiety Disorder">Anxiety Disorder</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Severity / Risk Alert</label>
                                <select
                                    value={selectedRisk}
                                    onChange={(e) => setSelectedRisk(e.target.value)}
                                    className="w-full text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="">All Risks</option>
                                    <option value="High">High Risk</option>
                                    <option value="Medium">Medium Risk</option>
                                    <option value="Low">Low Risk</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Treatment Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Under Monitoring">Under Monitoring</option>
                                    <option value="Recovered">Recovered</option>
                                </select>
                            </div>
                        </div>

                        {/* Reset button */}
                        {(selectedBarangay || selectedCategory || selectedRisk || selectedStatus || searchQuery) && (
                            <button
                                onClick={() => {
                                    setSelectedBarangay('');
                                    setSelectedCategory('');
                                    setSelectedRisk('');
                                    setSelectedStatus('');
                                    setSearchQuery('');
                                }}
                                className="mt-4 w-full text-center py-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg border border-teal-600/20 dark:border-teal-400/20 transition"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>

                    {/* Geotag alerts panel */}
                    {nonGeotaggedPatients.length > 0 && (
                        <div className="bg-amber-500/5 dark:bg-amber-500/10 p-5 rounded-2xl border border-amber-500/20 shadow-sm">
                            <h4 className="font-semibold text-sm mb-2 text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Missing Geotag ({nonGeotaggedPatients.length})
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">
                                Following patients lack GPS coordinates. Open their profile to tag their location.
                            </p>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {nonGeotaggedPatients.map(p => (
                                    <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                                        <div className="truncate font-semibold text-slate-700 dark:text-slate-300">
                                            {p.full_name}
                                            <span className="block text-[9px] text-slate-400 font-medium">{p.barangay}</span>
                                        </div>
                                        {p.isOffline ? (
                                            <span className="text-[9px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded font-bold">Offline</span>
                                        ) : (
                                            <Link
                                                href={`/patients/${p.id}/edit`}
                                                className="text-[10px] text-teal-600 hover:text-teal-700 font-bold hover:underline"
                                            >
                                                Add GPS
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Map Dashboard Box */}
                <div className="xl:col-span-3 flex flex-col space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[550px] md:h-[600px] relative">
                        {/* Map Container */}
                        <Map 
                            center={mapCenter} 
                            zoom={mapZoom} 
                            className="flex-1 w-full h-full"
                        >
                            {/* Render Markers for Geotagged Patients */}
                            {geotaggedPatients.map(p => (
                                <Marker
                                    key={p.id}
                                    latitude={Number(p.latitude)}
                                    longitude={Number(p.longitude)}
                                    onClick={() => setSelectedPatient(p)}
                                >
                                    {/* Custom Pulse Ping for Markers */}
                                    <div className="relative group cursor-pointer">
                                        <span className={`absolute -inset-1.5 animate-ping opacity-60 rounded-full ${
                                            p.isOffline ? 'bg-amber-400' : 
                                            p.risk_alert === 'High' ? 'bg-rose-500' :
                                            p.risk_alert === 'Medium' ? 'bg-orange-500' : 'bg-emerald-500'
                                        }`} />
                                        <div className={`h-5 w-5 rounded-full border-2 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-[9px] text-white font-bold transition-all duration-200 group-hover:scale-125 ${getRiskColor(p.risk_alert, p.isOffline)}`}>
                                            {p.full_name.charAt(0)}
                                        </div>
                                    </div>
                                </Marker>
                            ))}

                            {/* Render Selected Popup details */}
                            {selectedPatient && selectedPatient.latitude && selectedPatient.longitude && (
                                <Popup
                                    latitude={Number(selectedPatient.latitude)}
                                    longitude={Number(selectedPatient.longitude)}
                                    onClose={() => setSelectedPatient(null)}
                                >
                                    <div className="p-3 text-slate-800 dark:text-slate-200 min-w-[200px]">
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="font-bold text-sm leading-tight pr-2">{selectedPatient.full_name}</h5>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                                selectedPatient.isOffline ? 'bg-amber-500/20 text-amber-600' :
                                                selectedPatient.risk_alert === 'High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                                                selectedPatient.risk_alert === 'Medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' :
                                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                            }`}>
                                                {selectedPatient.isOffline ? 'Offline' : `${selectedPatient.risk_alert} Risk`}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{selectedPatient.barangay}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3">Category: {selectedPatient.case_category}</p>
                                        
                                        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            {selectedPatient.isOffline ? (
                                                <span className="text-[10px] text-slate-400 italic">Sync required to manage</span>
                                            ) : (
                                                <>
                                                    <Link
                                                        href={`/patients/${selectedPatient.id}`}
                                                        className="text-center flex-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold py-1.5 rounded transition"
                                                    >
                                                        Profile
                                                    </Link>
                                                    <Link
                                                        href={`/visits`}
                                                        className="text-center flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                                    >
                                                        Schedule
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            )}
                        </Map>

                        {/* Interactive Geotag Status Footer Banner */}
                        <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-lg border border-slate-200/50 dark:border-slate-800/80 px-4 py-2.5 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-4">
                            <span className="font-semibold text-slate-800 dark:text-white">Pins Legend:</span>
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> High Risk</span>
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Medium Risk</span>
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Low Risk</span>
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400 border border-dashed border-amber-600" /> Local Offline Draft</span>
                        </div>
                    </div>

                    {/* Patient List mini-selector */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">Patients in Search Panel ({filteredPatients.length})</h4>
                            <Link 
                                href="/patients/create" 
                                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Register Patient
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
                            {filteredPatients.length === 0 ? (
                                <div className="col-span-full py-8 text-center text-xs text-slate-400">
                                    No patients matching the chosen criteria.
                                </div>
                            ) : (
                                filteredPatients.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => handleFocusPatient(p)}
                                        className={`p-3 rounded-xl border transition cursor-pointer text-left flex items-center justify-between ${
                                            selectedPatient?.id === p.id 
                                                ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/10'
                                                : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                        }`}
                                    >
                                        <div className="truncate pr-2">
                                            <span className="font-semibold text-xs block truncate text-slate-700 dark:text-slate-300">{p.full_name}</span>
                                            <span className="text-[10px] text-slate-400 block truncate">{p.barangay} • {p.case_category}</span>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0 gap-1">
                                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                                p.status === 'Active' ? 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400' :
                                                p.status === 'Recovered' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' :
                                                'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                            }`}>
                                                {p.status}
                                            </span>
                                            {p.latitude && p.longitude ? (
                                                <span className="text-[9px] text-teal-600 dark:text-teal-400 font-medium flex items-center gap-0.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Geotagged
                                                </span>
                                            ) : (
                                                <span className="text-[9px] text-amber-500 font-medium flex items-center gap-0.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> No GPS
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
