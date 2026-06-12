<?php

namespace App\Http\Controllers;

use App\Models\FieldVisit;
use App\Models\Patient;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FieldVisitController extends Controller
{
    /**
     * Display a listing of field visits.
     */
    public function index(Request $request)
    {
        $query = FieldVisit::with('patient');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('visit_status', $request->input('status'));
        }

        // Filter by date range (e.g. today, future, past)
        if ($request->filled('timeframe')) {
            $timeframe = $request->input('timeframe');
            if ($timeframe === 'today') {
                $query->whereDate('scheduled_date', date('Y-m-d'));
            } elseif ($timeframe === 'upcoming') {
                $query->whereDate('scheduled_date', '>', date('Y-m-d'));
            } elseif ($timeframe === 'past') {
                $query->whereDate('scheduled_date', '<', date('Y-m-d'));
            }
        }

        $visits = $query->orderBy('scheduled_date', 'asc')->get();

        // Get list of active patients to populate dropdown in Schedule Visit Modal
        $patients = Patient::where('status', '!=', 'Recovered')
            ->orderBy('full_name', 'asc')
            ->get(['id', 'patient_id', 'full_name', 'barangay']);

        return Inertia::render('Visits/Index', [
            'visits' => $visits,
            'patients' => $patients,
            'filters' => $request->only(['status', 'timeframe']),
        ]);
    }

    /**
     * Store a newly scheduled field visit.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'scheduled_date' => 'required|date|after_or_equal:today',
            'staff_name' => 'required|string|max:255',
        ]);

        FieldVisit::create([
            'patient_id' => $validated['patient_id'],
            'scheduled_date' => $validated['scheduled_date'],
            'staff_name' => $validated['staff_name'],
            'visit_status' => 'Scheduled',
        ]);

        return redirect()->route('visits.index')->with('success', 'Field visit scheduled successfully.');
    }

    /**
     * Show the active visit monitor interface (mobile-friendly check-in/out).
     */
    public function active(FieldVisit $visit)
    {
        $visit->load('patient');
        return Inertia::render('Visits/Active', [
            'visit' => $visit,
        ]);
    }

    /**
     * Perform check-in for a field visit.
     */
    public function checkIn(Request $request, FieldVisit $visit)
    {
        $validated = $request->validate([
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $visit->update([
            'check_in_time' => now(),
            'check_in_latitude' => $validated['latitude'] ?? null,
            'check_in_longitude' => $validated['longitude'] ?? null,
            'visit_status' => 'Active',
        ]);

        return response()->json([
            'success' => true,
            'visit' => $visit->fresh(['patient']),
        ]);
    }

    /**
     * Perform check-out for a field visit and log observations.
     */
    public function checkOut(Request $request, FieldVisit $visit)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
            'medications_provided' => 'nullable|string',
            'follow_up_date' => 'nullable|date|after:today',
        ]);

        $visit->update([
            'check_out_time' => now(),
            'notes' => $validated['notes'],
            'medications_provided' => $validated['medications_provided'],
            'follow_up_date' => $validated['follow_up_date'] ?? null,
            'visit_status' => 'Completed',
        ]);

        // Auto-schedule follow-up visit if follow-up date is provided
        if (!empty($validated['follow_up_date'])) {
            FieldVisit::create([
                'patient_id' => $visit->patient_id,
                'scheduled_date' => $validated['follow_up_date'],
                'staff_name' => $visit->staff_name,
                'visit_status' => 'Scheduled',
            ]);
        }

        return redirect()->route('visits.index')->with('success', 'Field visit completed and logged.');
    }

    /**
     * Cancel a scheduled visit.
     */
    public function destroy(FieldVisit $visit)
    {
        $visit->update([
            'visit_status' => 'Cancelled',
        ]);

        return redirect()->route('visits.index')->with('success', 'Scheduled visit cancelled.');
    }
}
