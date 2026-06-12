import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import Layout from '../../components/Layout';
import { Map, Marker } from '../../components/ui/map';
import { getOfflineMode, queueOfflinePatient } from '../../lib/offlineStore';

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
}

interface FormProps {
    isEdit: boolean;
    patient: Patient | null;
}

export default function Form({ isEdit, patient }: FormProps) {
    const isOfflineMode = getOfflineMode();
    const [mapCenter, setMapCenter] = useState<[number, number]>([122.4025, 9.7512]);
    const [mapZoom, setMapZoom] = useState(12);
    const [gpsDetecting, setGpsDetecting] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [offlineSuccess, setOfflineSuccess] = useState(false);

    // Initial form fields
    const { data, setData, post, put, errors, processing } = useForm({
        full_name: patient?.full_name ?? '',
        age: patient?.age ?? '',
        sex: patient?.sex ?? 'Male',
        contact_number: patient?.contact_number ?? '',
        emergency_contact: {
            name: patient?.emergency_contact?.name ?? '',
            relation: patient?.emergency_contact?.relation ?? '',
            phone: patient?.emergency_contact?.phone ?? '',
        },
        barangay: patient?.barangay ?? '',
        address: patient?.address ?? '',
        latitude: patient?.latitude ?? '',
        longitude: patient?.longitude ?? '',
        case_category: patient?.case_category ?? 'Depression',
        status: patient?.status ?? 'Active',
        treatment_status: patient?.treatment_status ?? '',
        medication_notes: patient?.medication_notes ?? '',
        referral_history: patient?.referral_history ?? '',
        risk_alert: patient?.risk_alert ?? 'Low',
        assigned_staff_name: patient?.assigned_staff_name ?? '',
        house_photo: null as File | null,
    });

    // If patient already has geotag coords, center map there
    useEffect(() => {
        if (patient?.latitude && patient?.longitude) {
            setMapCenter([Number(patient.longitude), Number(patient.latitude)]);
            setMapZoom(15);
        }
    }, [patient]);

    // Handle map click to pin coordinates
    const handleMapClick = (e: any) => {
        // MapLibre click event gives { lngLat: { lng, lat } }
        if (e && e.lngLat) {
            const { lng, lat } = e.lngLat;
            setData(prev => ({
                ...prev,
                latitude: Number(lat.toFixed(6)),
                longitude: Number(lng.toFixed(6))
            }));
            setMapCenter([lng, lat]);
        }
    };

    // Auto-detect browser/mobile GPS
    const detectCurrentLocation = () => {
        if (!navigator.geolocation) {
            setGpsError('Geolocation is not supported by your browser.');
            return;
        }

        setGpsDetecting(true);
        setGpsError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setData(prev => ({
                    ...prev,
                    latitude: Number(latitude.toFixed(6)),
                    longitude: Number(longitude.toFixed(6))
                }));
                setMapCenter([longitude, latitude]);
                setMapZoom(15);
                setGpsDetecting(false);
            },
            (error) => {
                console.error(error);
                setGpsError('Unable to retrieve GPS coordinates. Please click on the map manually.');
                setGpsDetecting(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isOfflineMode) {
            // Queue offline draft
            const offlinePatient = {
                full_name: data.full_name,
                age: Number(data.age),
                sex: data.sex,
                contact_number: data.contact_number,
                emergency_contact: data.emergency_contact,
                barangay: data.barangay,
                address: data.address,
                latitude: data.latitude !== '' ? Number(data.latitude) : undefined,
                longitude: data.longitude !== '' ? Number(data.longitude) : undefined,
                case_category: data.case_category,
                status: data.status,
                treatment_status: data.treatment_status || undefined,
                medication_notes: data.medication_notes || undefined,
                referral_history: data.referral_history || undefined,
                risk_alert: data.risk_alert,
                assigned_staff_name: data.assigned_staff_name || 'Offline Cache'
            };

            queueOfflinePatient(offlinePatient);
            setOfflineSuccess(true);
            setTimeout(() => {
                router.visit('/');
            }, 2000);
            return;
        }

        // Online mode submitting
        if (isEdit && patient) {
            // Laravel forms with files don't support PUT natively, so we mimic it or submit as POST with _method = PUT
            if (data.house_photo) {
                // Laravel multipart patch trick
                router.post(`/patients/${patient.id}`, {
                    _method: 'PUT',
                    ...data
                });
            } else {
                put(`/patients/${patient.id}`);
            }
        } else {
            post('/patients');
        }
    };

    return (
        <Layout>
            <Head title={isEdit ? 'Edit Patient Record' : 'Register Patient'} />

            {offlineSuccess && (
                <div className="mb-6 p-4 bg-emerald-500 text-white rounded-2xl font-semibold text-center animate-bounce shadow-md">
                    Offline registration cached! Sync when internet is available. Redirecting to Dashboard...
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                <div className="mb-6 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        {isEdit ? 'Update Patient details' : 'Register Patient Household'}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {isOfflineMode 
                            ? 'You are offline. Forms will be cached locally on your device.'
                            : 'Complete patient demographic data, case file details, and map geolocations.'
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Form Inputs */}
                    <div className="space-y-6">
                        {/* Demographic Section */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Demographic Data</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.full_name}
                                        onChange={(e) => setData('full_name', e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                    {errors.full_name && <span className="text-red-500 text-[10px]">{errors.full_name}</span>}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Age</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            max="130"
                                            value={data.age}
                                            onChange={(e) => setData('age', e.target.value)}
                                            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                        />
                                        {errors.age && <span className="text-red-500 text-[10px]">{errors.age}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Sex</label>
                                        <select
                                            value={data.sex}
                                            onChange={(e) => setData('sex', e.target.value)}
                                            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Contact Number</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Mobile/Landline"
                                        value={data.contact_number}
                                        onChange={(e) => setData('contact_number', e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                    {errors.contact_number && <span className="text-red-500 text-[10px]">{errors.contact_number}</span>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Assigned Health Staff</label>
                                    <input
                                        type="text"
                                        placeholder="Staff Name"
                                        value={data.assigned_staff_name}
                                        onChange={(e) => setData('assigned_staff_name', e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Emergency Contact</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-1">
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Contact Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.emergency_contact.name}
                                        onChange={(e) => setData('emergency_contact', { ...data.emergency_contact, name: e.target.value })}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-855 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Relation</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Spouse, Parent"
                                        value={data.emergency_contact.relation}
                                        onChange={(e) => setData('emergency_contact', { ...data.emergency_contact, relation: e.target.value })}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-855 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Emergency Phone</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.emergency_contact.phone}
                                        onChange={(e) => setData('emergency_contact', { ...data.emergency_contact, phone: e.target.value })}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-855 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Medical Case details */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Case & Status Information</h4>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Case Category</label>
                                    <select
                                        value={data.case_category}
                                        onChange={(e) => setData('case_category', e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    >
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
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Alert Severity</label>
                                    <select
                                        value={data.risk_alert}
                                        onChange={(e) => setData('risk_alert', e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    >
                                        <option value="Low">Low Severity</option>
                                        <option value="Medium">Medium Severity</option>
                                        <option value="High">High Severity</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Patient Status</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Under Monitoring">Under Monitoring</option>
                                        <option value="Recovered">Recovered</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Medication Notes</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Medications, dosages, frequency..."
                                        value={data.medication_notes}
                                        onChange={(e) => setData('medication_notes', e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Treatment Status / Plan</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Details regarding current psychotherapy, clinical history, or home status..."
                                        value={data.treatment_status}
                                        onChange={(e) => setData('treatment_status', e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* House photo consent */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Optional House Photo (With Consent)</h4>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Upload House Picture</label>
                                <input
                                    type="file"
                                    disabled={isOfflineMode}
                                    onChange={(e) => setData('house_photo', e.target.files ? e.target.files[0] : null)}
                                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 disabled:opacity-50"
                                />
                                {isOfflineMode && (
                                    <span className="text-[10px] text-amber-500 font-medium block mt-1">Image uploads disabled in offline simulation mode.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Mapping & Coordinates Geotagger */}
                    <div className="flex flex-col space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Address & Geotagging Location</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Barangay</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Barangay Sabang"
                                        value={data.barangay}
                                        onChange={(e) => setData('barangay', e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                    {errors.barangay && <span className="text-red-500 text-[10px]">{errors.barangay}</span>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Detailed Street Address</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Street name, house number..."
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                    {errors.address && <span className="text-red-500 text-[10px]">{errors.address}</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Latitude</label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            placeholder="Auto-detected"
                                            value={data.latitude}
                                            onChange={(e) => setData('latitude', e.target.value)}
                                            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Longitude</label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            placeholder="Auto-detected"
                                            value={data.longitude}
                                            onChange={(e) => setData('longitude', e.target.value)}
                                            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={detectCurrentLocation}
                                    disabled={gpsDetecting}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition"
                                >
                                    {gpsDetecting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>Locating device...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>Auto-Detect Current GPS</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {gpsError && (
                                <p className="text-[10px] text-rose-500 font-medium">{gpsError}</p>
                            )}

                            {/* Geotag Map Component */}
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden h-[300px] xl:h-[350px] relative">
                                <Map
                                    center={mapCenter}
                                    zoom={mapZoom}
                                    className="w-full h-full"
                                    onClick={handleMapClick}
                                >
                                    {/* Display Pin at selected Lat/Lng */}
                                    {data.latitude && data.longitude && (
                                        <Marker
                                            latitude={Number(data.latitude)}
                                            longitude={Number(data.longitude)}
                                            color="#0f766e"
                                        />
                                    )}
                                </Map>
                                <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                    Click/Double-click on the map to pin household location
                                </div>
                            </div>
                        </div>

                        {/* Submit Actions */}
                        <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                            <Link
                                href={isEdit ? `/patients/${patient?.id}` : '/patients'}
                                className="flex-1 text-center py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-2 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 hover:scale-[1.01] transition-all disabled:opacity-50"
                            >
                                {processing ? 'Submitting...' : isEdit ? 'Update Record' : 'Save Patient Household'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
