import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../components/Layout';
import { getOfflineMode, queueOfflineVisit } from '../../lib/offlineStore';

interface Patient {
    id: number;
    full_name: string;
    barangay: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
}

interface Visit {
    id: number | string;
    patient_id: number | string;
    scheduled_date: string;
    visit_status: string;
    check_in_time: string | null;
    check_out_time: string | null;
    staff_name: string;
    patient: Patient;
}

interface ActiveProps {
    visit: Visit;
}

export default function Active({ visit }: ActiveProps) {
    const isOfflineMode = getOfflineMode();
    const [isCheckedIn, setIsCheckedIn] = useState(!!visit.check_in_time);
    const [checkInTime, setCheckInTime] = useState<Date | null>(visit.check_in_time ? new Date(visit.check_in_time) : null);
    const [duration, setDuration] = useState('00:00');
    const [distance, setDistance] = useState<number | null>(null);
    const [gpsDetecting, setGpsDetecting] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);

    // Form inputs
    const [notes, setNotes] = useState('');
    const [medicationsProvided, setMedicationsProvided] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [offlineCheckInCoords, setOfflineCheckInCoords] = useState<{ lat: number; lng: number } | null>(null);

    // Duration timer ticking
    useEffect(() => {
        if (!isCheckedIn || !checkInTime) return;

        const timer = setInterval(() => {
            const diffMs = new Date().getTime() - checkInTime.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffSecs = Math.floor((diffMs % 60000) / 1000);
            
            const minsStr = String(diffMins).padStart(2, '0');
            const secsStr = String(diffSecs).padStart(2, '0');
            setDuration(`${minsStr}:${secsStr}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [isCheckedIn, checkInTime]);

    // Calculate distance in meters using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return Math.round(R * c); // returns distance in meters
    };

    const handleCheckIn = () => {
        if (!navigator.geolocation) {
            setGpsError('Geolocation is not supported by your browser.');
            return;
        }

        setGpsDetecting(true);
        setGpsError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // If patient has coordinates, calculate check-in distance deviation
                if (visit.patient.latitude && visit.patient.longitude) {
                    const dist = calculateDistance(
                        latitude,
                        longitude,
                        Number(visit.patient.latitude),
                        Number(visit.patient.longitude)
                    );
                    setDistance(dist);
                }

                const now = new Date();
                setCheckInTime(now);

                if (isOfflineMode) {
                    setIsCheckedIn(true);
                    setOfflineCheckInCoords({ lat: latitude, lng: longitude });
                    setGpsDetecting(false);
                    return;
                }

                // Send request to server
                try {
                    const response = await fetch(`/visits/${visit.id}/check-in`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ latitude, longitude })
                    });
                    const result = await response.json();
                    if (result.success) {
                        setIsCheckedIn(true);
                    } else {
                        setGpsError('Check-in rejected by server.');
                    }
                } catch (e) {
                    setGpsError('Connection error during check-in.');
                }
                setGpsDetecting(false);
            },
            (error) => {
                console.error(error);
                setGpsError('Unable to detect GPS. Please check device location settings.');
                setGpsDetecting(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const handleCheckOut = () => {
        if (isOfflineMode) {
            // Write completed visit to localStorage
            const offlineVisits = JSON.parse(localStorage.getItem('scm_offline_visits') || '[]');
            
            // Queue visit completeness
            queueOfflineVisit({
                patient_id: visit.patient_id,
                scheduled_date: visit.scheduled_date,
                visit_status: 'Completed',
                check_in_time: checkInTime?.toISOString(),
                check_out_time: new Date().toISOString(),
                check_in_latitude: offlineCheckInCoords?.lat,
                check_in_longitude: offlineCheckInCoords?.lng,
                notes,
                medications_provided: medicationsProvided,
                follow_up_date: followUpDate || undefined,
                staff_name: visit.staff_name
            });

            // Redirect back to dashboard
            router.visit('/visits');
            return;
        }

        // Online mode complete submit
        router.post(`/visits/${visit.id}/check-out`, {
            notes,
            medications_provided: medicationsProvided,
            follow_up_date: followUpDate || undefined
        });
    };

    return (
        <Layout>
            <Head title="Outreach Check-In Terminal" />

            <div className="max-w-xl mx-auto space-y-6">
                
                {/* Back Nav Link */}
                <Link
                    href="/visits"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Visit Schedule
                </Link>

                {/* Patient / Household info header card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">Current Monitoring Target</span>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-1">{visit.patient.full_name}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{visit.patient.barangay} • {visit.patient.address}</p>

                    {/* Geotag Coordinates Verification block */}
                    {visit.patient.latitude && visit.patient.longitude && (
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Household Coordinates</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {visit.patient.latitude}, {visit.patient.longitude}
                            </span>
                        </div>
                    )}
                </div>

                {/* Check-In / Check-Out Actions Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 text-center space-y-6">
                    
                    {!isCheckedIn ? (
                        // Check In Screen
                        <div className="py-6 space-y-4">
                            <div className="h-16 w-16 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-2xl mx-auto flex items-center justify-center">
                                <svg className="h-8 w-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-base text-slate-800 dark:text-white">Arrived at Household?</h4>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                                    Click below to check in. The system will grab your GPS coordinates to verify site visit arrival.
                                </p>
                            </div>

                            <button
                                onClick={handleCheckIn}
                                disabled={gpsDetecting}
                                className="w-full max-w-xs mx-auto py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 transition hover:scale-[1.01] flex items-center justify-center gap-2"
                            >
                                {gpsDetecting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Capturing GPS Location...</span>
                                    </>
                                ) : (
                                    <span>CHECK IN NOW</span>
                                )}
                            </button>

                            {gpsError && (
                                <p className="text-xs text-rose-500 font-semibold">{gpsError}</p>
                            )}
                        </div>
                    ) : (
                        // Check Out & Observation Log Screen
                        <div className="space-y-6 text-left">
                            {/* Header Status & Live Ticker */}
                            <div className="flex items-center justify-between p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                <div>
                                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">ACTIVE VISIT</span>
                                    <p className="text-xs text-slate-400 mt-0.5">Checked In: {checkInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{duration}</span>
                                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Duration</span>
                                </div>
                            </div>

                            {/* Distance delta estimation check */}
                            {distance !== null && (
                                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                                    distance <= 100 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400'
                                        : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400'
                                }`}>
                                    <span>Distance Verification:</span>
                                    <span>
                                        {distance <= 100 
                                            ? `Verified (${distance}m from household)` 
                                            : `GPS Deviation (${distance}m away)`
                                        }
                                    </span>
                                </div>
                            )}

                            {/* Observation Form Inputs */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">Visit Log Details</h4>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Medications Provided</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Risperidone 2mg, Escitalopram 10mg..."
                                        value={medicationsProvided}
                                        onChange={(e) => setMedicationsProvided(e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Notes & Behavioral Observations</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Note patient mental status, medication compliance, changes, follow-up recommendations..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Recommended Follow-Up Date (Optional)</label>
                                    <input
                                        type="date"
                                        min={new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]} // tomorrow
                                        value={followUpDate}
                                        onChange={(e) => setFollowUpDate(e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                    <span className="text-[10px] text-slate-400 block mt-1">If set, the system will automatically schedule a subsequent visit for this patient.</span>
                                </div>
                            </div>

                            {/* Submit complete */}
                            <button
                                onClick={handleCheckOut}
                                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/20 transition hover:scale-[1.01] flex items-center justify-center gap-2"
                            >
                                <span>CHECK OUT & COMPLETE VISIT</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
