<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\FieldVisitController;
use Illuminate\Support\Facades\Route;

// Dashboard Map & Statistics
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

// Patients Management CRUD
Route::resource('patients', PatientController::class);

// Offline Synchronization Endpoint
Route::post('offline-sync', [PatientController::class, 'offlineSync'])->name('offline.sync');

// Field Visit logs & Scheduling
Route::get('visits', [FieldVisitController::class, 'index'])->name('visits.index');
Route::post('visits', [FieldVisitController::class, 'store'])->name('visits.store');
Route::get('visits/{visit}/active', [FieldVisitController::class, 'active'])->name('visits.active');
Route::post('visits/{visit}/check-in', [FieldVisitController::class, 'checkIn'])->name('visits.check-in');
Route::post('visits/{visit}/check-out', [FieldVisitController::class, 'checkOut'])->name('visits.check-out');
Route::delete('visits/{visit}', [FieldVisitController::class, 'destroy'])->name('visits.destroy');

// Reports Dashboard
Route::get('reports', function () {
    $barangays = \App\Models\Patient::select('barangay', \DB::raw('count(*) as count'))
        ->groupBy('barangay')
        ->get();

    $cases = \App\Models\Patient::select('case_category', \DB::raw('count(*) as count'))
        ->groupBy('case_category')
        ->get();

    $risks = \App\Models\Patient::select('risk_alert', \DB::raw('count(*) as count'))
        ->groupBy('risk_alert')
        ->get();

    $completedVisits = \App\Models\FieldVisit::where('visit_status', 'Completed')->count();
    $scheduledVisits = \App\Models\FieldVisit::where('visit_status', 'Scheduled')->count();
    $cancelledVisits = \App\Models\FieldVisit::where('visit_status', 'Cancelled')->count();

    return \Inertia\Inertia::render('Reports/Index', [
        'barangay_data' => $barangays,
        'case_data' => $cases,
        'risk_data' => $risks,
        'visit_summary' => [
            'completed' => $completedVisits,
            'scheduled' => $scheduledVisits,
            'cancelled' => $cancelledVisits,
        ]
    ]);
})->name('reports.index');
