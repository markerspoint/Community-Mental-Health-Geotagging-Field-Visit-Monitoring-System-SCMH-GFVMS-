// Offline Storage & Sync Helper for SCMH-GFVMS

export interface OfflinePatient {
    id: string; // temp client-side ID
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
    latitude?: number;
    longitude?: number;
    case_category: string;
    status: string;
    treatment_status?: string;
    medication_notes?: string;
    referral_history?: string;
    risk_alert: string;
    assigned_staff_name?: string;
}

export interface OfflineVisit {
    id: string; // temp client-side ID
    patient_id: string | number; // references database ID or temp client ID
    scheduled_date: string;
    visit_status: string;
    check_in_time?: string;
    check_out_time?: string;
    check_in_latitude?: number;
    check_in_longitude?: number;
    notes?: string;
    medications_provided?: string;
    follow_up_date?: string;
    staff_name: string;
}

// Check if manually set offline or browser is offline
export function getOfflineMode(): boolean {
    const manualOffline = localStorage.getItem('scm_manual_offline') === 'true';
    const navigatorOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    return manualOffline || navigatorOffline;
}

export function setManualOfflineMode(offline: boolean) {
    localStorage.setItem('scm_manual_offline', offline ? 'true' : 'false');
    window.dispatchEvent(new Event('offline-mode-change'));
}

// Queue offline patient
export function queueOfflinePatient(patient: Omit<OfflinePatient, 'id'>): OfflinePatient {
    const queue = getOfflinePatients();
    const tempId = 'temp_pt_' + Math.random().toString(36).substr(2, 9);
    const newPatient: OfflinePatient = { ...patient, id: tempId };
    queue.push(newPatient);
    localStorage.setItem('scm_offline_patients', JSON.stringify(queue));
    window.dispatchEvent(new Event('offline-queue-change'));
    return newPatient;
}

export function getOfflinePatients(): OfflinePatient[] {
    const data = localStorage.getItem('scm_offline_patients');
    return data ? JSON.parse(data) : [];
}

// Queue offline visit
export function queueOfflineVisit(visit: Omit<OfflineVisit, 'id'>): OfflineVisit {
    const queue = getOfflineVisits();
    const tempId = 'temp_vt_' + Math.random().toString(36).substr(2, 9);
    const newVisit: OfflineVisit = { ...visit, id: tempId };
    queue.push(newVisit);
    localStorage.setItem('scm_offline_visits', JSON.stringify(queue));
    window.dispatchEvent(new Event('offline-queue-change'));
    return newVisit;
}

export function getOfflineVisits(): OfflineVisit[] {
    const data = localStorage.getItem('scm_offline_visits');
    return data ? JSON.parse(data) : [];
}

export function getPendingCount(): number {
    return getOfflinePatients().length + getOfflineVisits().length;
}

export function clearOfflineQueue() {
    localStorage.removeItem('scm_offline_patients');
    localStorage.removeItem('scm_offline_visits');
    window.dispatchEvent(new Event('offline-queue-change'));
}

// Sync function
export async function syncOfflineData(): Promise<{ success: boolean; message: string; patientsCount: number; visitsCount: number }> {
    const patients = getOfflinePatients();
    const visits = getOfflineVisits();

    if (patients.length === 0 && visits.length === 0) {
        return { success: true, message: 'Nothing to sync.', patientsCount: 0, visitsCount: 0 };
    }

    try {
        const response = await fetch('/offline-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ patients, visits })
        });

        const result = await response.json();

        if (result.success) {
            clearOfflineQueue();
            return {
                success: true,
                message: result.message || 'Data synced successfully!',
                patientsCount: result.synced_patients || 0,
                visitsCount: result.synced_visits || 0
            };
        } else {
            throw new Error(result.message || 'Sync request rejected by server.');
        }
    } catch (error: any) {
        console.error('Offline sync error:', error);
        return {
            success: false,
            message: error.message || 'Network error occurred during sync.',
            patientsCount: 0,
            visitsCount: 0
        };
    }
}
