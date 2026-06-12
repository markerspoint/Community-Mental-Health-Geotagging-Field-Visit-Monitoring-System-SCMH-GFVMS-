import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../components/Layout';
import { Map, Marker, Popup } from '../components/ui/map';
import { getOfflinePatients, OfflinePatient, getOfflineMode, queueOfflineVisit } from '../lib/offlineStore';
import { capitalizeWords } from '../lib/utils';
import { ScheduleModal } from '../components/ui/ScheduleModal';

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
    has_active_schedule?: boolean;
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
    
    // UI states
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState<'filters' | 'gps'>('filters');
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

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

    // Reset tab if no untagged patients left
    useEffect(() => {
        if (nonGeotaggedPatients.length === 0 && activeTab === 'gps') {
            setActiveTab('filters');
        }
    }, [nonGeotaggedPatients.length, activeTab]);

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

    const handleScheduleClick = () => {
        if (!selectedPatient) return;

        const isOffline = getOfflineMode();
        if (isOffline) {
            const offlineVisits = JSON.parse(localStorage.getItem('scm_offline_visits') || '[]');
            const existingOfflineVisit = offlineVisits.find(
                (v: any) => v.patient_id === selectedPatient.id && (v.visit_status === 'Scheduled' || v.visit_status === 'Active')
            );

            if (existingOfflineVisit) {
                router.visit('/visits');
            } else {
                setIsScheduleModalOpen(true);
            }
        } else {
            if (selectedPatient.has_active_schedule) {
                router.visit('/visits');
            } else {
                setIsScheduleModalOpen(true);
            }
        }
    };

    const handleConfirmSchedule = (date: string, staffName: string) => {
        if (!selectedPatient) return;

        const isOffline = getOfflineMode();
        if (isOffline) {
            queueOfflineVisit({
                patient_id: selectedPatient.id,
                scheduled_date: date,
                visit_status: 'Scheduled',
                staff_name: staffName
            });
            router.visit('/visits');
        } else {
            router.post('/visits', {
                patient_id: selectedPatient.id,
                scheduled_date: date,
                staff_name: staffName
            });
        }
    };

    const activeFiltersCount = [
        selectedBarangay ? 1 : 0,
        selectedCategory ? 1 : 0,
        selectedRisk ? 1 : 0,
        selectedStatus ? 1 : 0,
        searchQuery ? 1 : 0
    ].reduce((a, b) => a + b, 0);

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
            <div className="space-y-6">
                {/* Full-width Map Container */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[600px] md:h-[650px] relative">
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
                                        {p.full_name.charAt(0).toUpperCase()}
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
                                        <h5 className="font-bold text-sm leading-tight pr-2">{capitalizeWords(selectedPatient.full_name)}</h5>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                            selectedPatient.isOffline ? 'bg-amber-500/20 text-amber-600' :
                                            selectedPatient.risk_alert === 'High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                                            selectedPatient.risk_alert === 'Medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' :
                                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                        }`}>
                                            {selectedPatient.isOffline ? 'Offline' : `${selectedPatient.risk_alert} Risk`}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{capitalizeWords(selectedPatient.barangay)}</p>
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
                                                <button
                                                    onClick={handleScheduleClick}
                                                    className="text-center flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                                                >
                                                    Schedule
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        )}

                        {/* Collapsible Floating Dashboard Control Overlay */}
                        {isFiltersExpanded ? (
                            <div className="absolute top-4 left-4 z-20 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col max-h-[calc(100%-6rem)] overflow-y-auto">
                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                                        <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        Map Dashboard Control
                                    </h4>
                                    <button 
                                        onClick={() => setIsFiltersExpanded(false)}
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition"
                                        title="Hide Controls"
                                    >
                                        <svg className="h-4 w-4 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Tabs for Filters and Missing GPS */}
                                <div className="flex gap-1.5 mb-3.5 bg-slate-100/60 dark:bg-slate-800/55 p-1 rounded-xl">
                                    <button
                                        onClick={() => setActiveTab('filters')}
                                        className={`flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                                            activeTab === 'filters'
                                                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                                    </button>
                                    {nonGeotaggedPatients.length > 0 && (
                                        <button
                                            onClick={() => setActiveTab('gps')}
                                            className={`flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                                activeTab === 'gps'
                                                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            No GPS
                                            <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                                                {nonGeotaggedPatients.length}
                                            </span>
                                        </button>
                                    )}
                                </div>

                                {activeTab === 'filters' ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search Directory</label>
                                            <input
                                                type="text"
                                                placeholder="Search name, ID, barangay..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full text-xs rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Barangay</label>
                                            <select
                                                value={selectedBarangay}
                                                onChange={(e) => setSelectedBarangay(e.target.value)}
                                                className="w-full text-xs rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-200"
                                            >
                                                <option value="">All Barangays</option>
                                                {filterOptions.barangays.map(b => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Case Category</label>
                                            <select
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                                className="w-full text-xs rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-200"
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
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Severity / Risk Alert</label>
                                            <select
                                                value={selectedRisk}
                                                onChange={(e) => setSelectedRisk(e.target.value)}
                                                className="w-full text-xs rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-200"
                                            >
                                                <option value="">All Risks</option>
                                                <option value="High">High Risk</option>
                                                <option value="Medium">Medium Risk</option>
                                                <option value="Low">Low Risk</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Treatment Status</label>
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                                className="w-full text-xs rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-200"
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="Active">Active</option>
                                                <option value="Under Monitoring">Under Monitoring</option>
                                                <option value="Recovered">Recovered</option>
                                            </select>
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
                                                className="mt-2 w-full text-center py-2 text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg border border-teal-600/20 dark:border-teal-400/20 transition"
                                            >
                                                Clear All Filters
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        <p className="text-[10px] text-slate-400 mb-2 font-medium">
                                            The following patients lack GPS coordinates. Click to locate/tag them on the map.
                                        </p>
                                        {nonGeotaggedPatients.map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                                                <div className="truncate font-semibold text-slate-700 dark:text-slate-300 pr-2">
                                                    {capitalizeWords(p.full_name)}
                                                    <span className="block text-[9px] text-slate-400 font-medium">{capitalizeWords(p.barangay)}</span>
                                                </div>
                                                {p.isOffline ? (
                                                    <span className="text-[8px] bg-amber-500/20 text-amber-600 px-1 py-0.5 rounded font-bold">Offline</span>
                                                ) : (
                                                    <Link
                                                        href={`/patients/${p.id}/edit`}
                                                        className="text-[10px] text-teal-600 hover:text-teal-700 font-bold hover:underline shrink-0"
                                                    >
                                                        Add GPS
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsFiltersExpanded(true)}
                                className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/50 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer rounded-xl transition"
                            >
                                <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span className="text-xs font-bold text-slate-800 dark:text-white">Filters</span>
                                {activeFiltersCount > 0 && (
                                    <span className="bg-teal-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Interactive Geotag Status Footer Banner */}
                        <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-lg border border-slate-200/50 dark:border-slate-800/80 px-4 py-2.5 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-4 flex-wrap">
                            <span className="font-semibold text-slate-800 dark:text-white">Pins Legend:</span>
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> High Risk</span>
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Medium Risk</span>
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Low Risk</span>
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400 border border-dashed border-amber-600" /> Local Offline Draft</span>
                        </div>
                    </Map>
                </div>

                {/* Patient List selector */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
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
                                        <span className="font-semibold text-xs block truncate text-slate-700 dark:text-slate-300">{capitalizeWords(p.full_name)}</span>
                                        <span className="text-[10px] text-slate-400 block truncate">{capitalizeWords(p.barangay)} • {p.case_category}</span>
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
            {selectedPatient && (
                <ScheduleModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    onConfirm={handleConfirmSchedule}
                    patientName={selectedPatient.full_name}
                    assignedStaffName={selectedPatient.assigned_staff_name}
                />
            )}
        </Layout>
    );
}

