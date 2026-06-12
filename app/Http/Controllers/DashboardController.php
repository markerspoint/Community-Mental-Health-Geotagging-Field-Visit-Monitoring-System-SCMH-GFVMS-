<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\FieldVisit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the system dashboard.
     */
    public function index()
    {
        // 1. Gather Summary Statistics
        $totalPatients = Patient::count();
        $activePatients = Patient::where('status', 'Active')->count();
        $underMonitoring = Patient::where('status', 'Under Monitoring')->count();
        $recoveredPatients = Patient::where('status', 'Recovered')->count();
        
        $highRiskPatients = Patient::where('risk_alert', 'High')->count();
        $todayVisitsCount = FieldVisit::whereDate('scheduled_date', date('Y-m-d'))->count();
        
        $completedVisitsThisMonth = FieldVisit::where('visit_status', 'Completed')
            ->whereMonth('check_out_time', date('m'))
            ->whereYear('check_out_time', date('Y'))
            ->count();

        // 2. Fetch Patients for Map Pins (must have coordinates)
        $patients = Patient::select([
            'id',
            'patient_id',
            'full_name',
            'latitude',
            'longitude',
            'barangay',
            'status',
            'case_category',
            'risk_alert',
            'assigned_staff_name',
        ])->get();

        // 3. Unique values for filter sidebar
        $barangays = Patient::distinct()->pluck('barangay')->filter()->values();
        $caseCategories = Patient::distinct()->pluck('case_category')->filter()->values();
        $staffNames = Patient::distinct()->pluck('assigned_staff_name')->filter()->values();

        // 4. Return to Inertia
        return Inertia::render('Dashboard', [
            'stats' => [
                'total_patients' => $totalPatients,
                'active_patients' => $activePatients,
                'under_monitoring' => $underMonitoring,
                'recovered_patients' => $recoveredPatients,
                'high_risk_patients' => $highRiskPatients,
                'today_visits_count' => $todayVisitsCount,
                'completed_visits_this_month' => $completedVisitsThisMonth,
            ],
            'patients' => $patients,
            'filters' => [
                'barangays' => $barangays,
                'case_categories' => $caseCategories,
                'staff_names' => $staffNames,
            ]
        ]);
    }
}
