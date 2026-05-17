<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shelter_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('civilian_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('shelter_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['invitation', 'request']);
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->foreignId('initiated_by')->constrained('users');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
            $table->unique(['civilian_id', 'shelter_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shelter_requests');
    }
};
