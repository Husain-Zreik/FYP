<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aid_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shelter_id')->constrained()->cascadeOnDelete();
            $table->foreignId('aid_category_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity_requested');
            $table->enum('urgency', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->text('reason');
            $table->enum('status', ['pending', 'approved', 'partially_approved', 'rejected', 'fulfilled'])->default('pending');
            $table->unsignedInteger('quantity_approved')->nullable();
            $table->text('government_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->nullOnDelete()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aid_requests');
    }
};
