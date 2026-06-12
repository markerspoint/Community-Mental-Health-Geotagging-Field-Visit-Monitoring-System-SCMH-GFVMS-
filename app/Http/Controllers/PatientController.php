<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\FieldVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PatientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Patient::query();

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('patient_id', 'like', "%{$search}%");
            });
        }

        // Barangay filter
        if ($request->filled('barangay')) {
            $query->where('barangay', $request->input('barangay'));
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Case category filter
        if ($request->filled('case_category')) {
            $query->where('case_category', $request->input('case_category'));
        }

        // Risk alert filter
        if ($request->filled('risk_alert')) {
            $query->where('risk_alert', $request->input('risk_alert'));
        }

        $patients = $query->latest()->get();

        // Get unique barangays for filter dropdown
        $barangays = Patient::distinct()->pluck('barangay')->filter()->values();

        return Inertia::render('Patients/Index', [
            'patients' => $patients,
            'barangays' => $barangays,
            'filters' => $request->only(['search', 'barangay', 'status', 'case_category', 'risk_alert']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Patients/Form', [
            'isEdit' => false,
            'patient' => null,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'age' => 'required|integer|min:0|max:150',
            'sex' => 'required|string|in:Male,Female,Other',
            'contact_number' => 'required|string|max:50',
            'emergency_contact.name' => 'required|string|max:255',
            'emergency_contact.relation' => 'required|string|max:255',
            'emergency_contact.phone' => 'required|string|max:50',
            'barangay' => 'required|string|max:255',
            'address' => 'required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'case_category' => 'required|string',
            'status' => 'required|string|in:Active,Recovered,Under Monitoring',
            'treatment_status' => 'nullable|string',
            'medication_notes' => 'nullable|string',
            'referral_history' => 'nullable|string',
            'risk_alert' => 'required|string|in:Low,Medium,High',
            'assigned_staff_name' => 'nullable|string|max:255',
            'house_photo' => 'nullable|image|max:2048', // max 2MB
        ]);

        // Auto-generate patient ID: PT-YYYY-XXXX
        $year = date('Y');
        $count = Patient::where('patient_id', 'like', "PT-{$year}-%")->count();
        $patientId = 'PT-' . $year . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

        $data = $validated;
        $data['patient_id'] = $patientId;

        if ($request->hasFile('house_photo')) {
            $path = $request->file('house_photo')->store('patient_photos', 'public');
            $data['house_photo_path'] = '/storage/' . $path;
        }

        Patient::create($data);

        return redirect()->route('patients.index')->with('success', 'Patient registered successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Patient $patient)
    {
        $patient->load('fieldVisits');
        return Inertia::render('Patients/Show', [
            'patient' => $patient,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Patient $patient)
    {
        return Inertia::render('Patients/Form', [
            'isEdit' => true,
            'patient' => $patient,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Patient $patient)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'age' => 'required|integer|min:0|max:150',
            'sex' => 'required|string|in:Male,Female,Other',
            'contact_number' => 'required|string|max:50',
            'emergency_contact.name' => 'required|string|max:255',
            'emergency_contact.relation' => 'required|string|max:255',
            'emergency_contact.phone' => 'required|string|max:50',
            'barangay' => 'required|string|max:255',
            'address' => 'required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'case_category' => 'required|string',
            'status' => 'required|string|in:Active,Recovered,Under Monitoring',
            'treatment_status' => 'nullable|string',
            'medication_notes' => 'nullable|string',
            'referral_history' => 'nullable|string',
            'risk_alert' => 'required|string|in:Low,Medium,High',
            'assigned_staff_name' => 'nullable|string|max:255',
            'house_photo' => 'nullable|image|max:2048',
        ]);

        $data = $validated;

        if ($request->hasFile('house_photo')) {
            // Delete old photo if exists
            if ($patient->house_photo_path) {
                $oldPath = str_replace('/storage/', '', $patient->house_photo_path);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('house_photo')->store('patient_photos', 'public');
            $data['house_photo_path'] = '/storage/' . $path;
        }

        $patient->update($data);

        return redirect()->route('patients.show', $patient->id)->with('success', 'Patient updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Patient $patient)
    {
        if ($patient->house_photo_path) {
            $path = str_replace('/storage/', '', $patient->house_photo_path);
            Storage::disk('public')->delete($path);
        }

        $patient->delete();

        return redirect()->route('patients.index')->with('success', 'Patient record deleted.');
    }

    /**
     * Synchronize offline data.
     */
    public function offlineSync(Request $request)
    {
        $request->validate([
            'patients' => 'nullable|array',
            'visits' => 'nullable|array',
        ]);

        $syncedPatientsCount = 0;
        $syncedVisitsCount = 0;

        DB::beginTransaction();

        try {
            // 1. Sync Patients
            $patientIdMapping = []; // map client-side temp UUID/ID to server database ID
            
            if ($request->has('patients')) {
                foreach ($request->input('patients') as $offlinePatient) {
                    // Generate unique ID
                    $year = date('Y');
                    $count = Patient::where('patient_id', 'like', "PT-{$year}-%")->count() + $syncedPatientsCount;
                    $patientId = 'PT-' . $year . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

                    $patient = Patient::create([
                        'patient_id' => $patientId,
                        'full_name' => $offlinePatient['full_name'],
                        'age' => $offlinePatient['age'],
                        'sex' => $offlinePatient['sex'],
                        'contact_number' => $offlinePatient['contact_number'],
                        'emergency_contact' => $offlinePatient['emergency_contact'],
                        'barangay' => $offlinePatient['barangay'],
                        'address' => $offlinePatient['address'],
                        'latitude' => $offlinePatient['latitude'] ?? null,
                        'longitude' => $offlinePatient['longitude'] ?? null,
                        'case_category' => $offlinePatient['case_category'],
                        'status' => $offlinePatient['status'] ?? 'Active',
                        'treatment_status' => $offlinePatient['treatment_status'] ?? null,
                        'medication_notes' => $offlinePatient['medication_notes'] ?? null,
                        'referral_history' => $offlinePatient['referral_history'] ?? null,
                        'risk_alert' => $offlinePatient['risk_alert'] ?? 'Low',
                        'assigned_staff_name' => $offlinePatient['assigned_staff_name'] ?? 'Mobile Staff',
                        'house_photo_path' => $offlinePatient['house_photo_path'] ?? null, // Note: photo sync via base64 or separate upload would be complex, handles text mostly
                    ]);

                    // Map the local temporary ID (or name if no temp ID) to the newly created DB id
                    $clientTempId = $offlinePatient['id'] ?? $offlinePatient['full_name'];
                    $patientIdMapping[$clientTempId] = $patient->id;
                    $syncedPatientsCount++;
                }
            }

            // 2. Sync Field Visits
            if ($request->has('visits')) {
                foreach ($request->input('visits') as $offlineVisit) {
                    $patientId = null;

                    // Resolve patient ID
                    if (isset($offlineVisit['patient_id'])) {
                        // Check if it was newly synced
                        if (array_key_exists($offlineVisit['patient_id'], $patientIdMapping)) {
                            $patientId = $patientIdMapping[$offlineVisit['patient_id']];
                        } else {
                            // Already exists on server
                            $patientId = $offlineVisit['patient_id'];
                        }
                    }

                    if ($patientId) {
                        FieldVisit::create([
                            'patient_id' => $patientId,
                            'scheduled_date' => $offlineVisit['scheduled_date'] ?? date('Y-m-d'),
                            'visit_status' => $offlineVisit['visit_status'] ?? 'Completed',
                            'check_in_time' => $offlineVisit['check_in_time'] ?? null,
                            'check_out_time' => $offlineVisit['check_out_time'] ?? null,
                            'check_in_latitude' => $offlineVisit['check_in_latitude'] ?? null,
                            'check_in_longitude' => $offlineVisit['check_in_longitude'] ?? null,
                            'notes' => $offlineVisit['notes'] ?? null,
                            'medications_provided' => $offlineVisit['medications_provided'] ?? null,
                            'follow_up_date' => $offlineVisit['follow_up_date'] ?? null,
                            'staff_name' => $offlineVisit['staff_name'] ?? 'Mobile Staff',
                        ]);
                        $syncedVisitsCount++;
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully synchronized offline records.",
                'synced_patients' => $syncedPatientsCount,
                'synced_visits' => $syncedVisitsCount,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Sync failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
