<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add housing_status to civilian_profiles
        Schema::table('civilian_profiles', function (Blueprint $table) {
            // seeking = still looking | private = found own housing | in_shelter handled by shelter_id
            $table->enum('housing_status', ['seeking', 'private'])->default('seeking')->after('id_document_path');
        });

        // Private accommodation details
        Schema::create('civilian_private_housings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('civilian_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->enum('property_type', ['apartment', 'house', 'room', 'other'])->default('apartment');
            $table->string('address');
            $table->string('governorate')->nullable();
            $table->string('district')->nullable();
            $table->string('landlord_name');
            $table->string('landlord_phone')->nullable();
            $table->decimal('monthly_rent', 10, 2)->nullable();
            $table->date('lease_start_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('civilian_private_housings');
        Schema::table('civilian_profiles', function (Blueprint $table) {
            $table->dropColumn('housing_status');
        });
    }
};
