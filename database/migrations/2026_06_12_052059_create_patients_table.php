<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id')->unique();
            $table->string('full_name');
            $table->integer('age');
            $table->string('sex');
            $table->string('contact_number');
            $table->json('emergency_contact'); // JSON of { name, relation, phone }
            $table->string('barangay');
            $table->text('address');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('case_category');
            $table->string('status')->default('Active'); // Active, Recovered, Under Monitoring
            $table->text('treatment_status')->nullable();
            $table->text('medication_notes')->nullable();
            $table->text('referral_history')->nullable();
            $table->string('risk_alert')->default('Low'); // Low, Medium, High
            $table->string('house_photo_path')->nullable();
            $table->string('assigned_staff_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
