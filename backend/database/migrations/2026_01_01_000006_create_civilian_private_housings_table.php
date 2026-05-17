<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('civilian_private_housings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('civilian_id')->constrained('users')->cascadeOnDelete();
            $table->string('property_type')->nullable();
            $table->string('address')->nullable();
            $table->string('governorate')->nullable();
            $table->string('district')->nullable();
            $table->string('landlord_name')->nullable();
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
    }
};
