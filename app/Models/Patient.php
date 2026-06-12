<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    protected $fillable = [
        'patient_id',
        'full_name',
        'age',
        'sex',
        'contact_number',
        'emergency_contact',
        'barangay',
        'address',
        'latitude',
        'longitude',
        'case_category',
        'status',
        'treatment_status',
        'medication_notes',
        'referral_history',
        'risk_alert',
        'house_photo_path',
        'assigned_staff_name',
    ];

    protected $casts = [
        'emergency_contact' => 'array',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    public function fieldVisits(): HasMany
    {
        return $this->hasMany(FieldVisit::class)->orderBy('scheduled_date', 'desc');
    }
}
