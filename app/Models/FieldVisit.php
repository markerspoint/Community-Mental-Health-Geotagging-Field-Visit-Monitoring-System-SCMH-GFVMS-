<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FieldVisit extends Model
{
    protected $fillable = [
        'patient_id',
        'scheduled_date',
        'visit_status',
        'check_in_time',
        'check_out_time',
        'check_in_latitude',
        'check_in_longitude',
        'notes',
        'medications_provided',
        'follow_up_date',
        'staff_name',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'check_in_latitude' => 'decimal:8',
        'check_in_longitude' => 'decimal:8',
        'follow_up_date' => 'date',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
