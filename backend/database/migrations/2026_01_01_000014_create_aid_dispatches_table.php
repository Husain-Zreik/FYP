<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aid_dispatches', function (Blueprint $table) {
            $table->id();
            $table->enum('level', ['government_shelter', 'shelter_civilian']);
            $table->foreignId('dispatched_by')->constrained('users');
            $table->foreignId('shelter_id')->constrained()->cascadeOnDelete();
            $table->foreignId('civilian_id')->nullable()->nullOnDelete()->constrained('users');
            $table->foreignId('aid_category_id')->constrained('aid_categories');
            $table->foreignId('aid_request_id')->nullable()->nullOnDelete()->constrained('aid_requests');
            $table->foreignId('civilian_need_id')->nullable()->nullOnDelete()->constrained('civilian_needs');
            $table->foreignId('aid_schedule_id')->nullable()->nullOnDelete()->constrained('aid_schedules');
            $table->unsignedInteger('quantity');
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->timestamp('dispatched_at')->useCurrent();
            $table->timestamp('responded_at')->nullable();
            $table->date('received_at')->nullable();
            $table->foreignId('responded_by')->nullable()->nullOnDelete()->constrained('users');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aid_dispatches');
    }
};
