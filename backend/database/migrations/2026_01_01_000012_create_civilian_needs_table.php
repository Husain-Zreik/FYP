<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('civilian_needs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('civilian_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('shelter_id')->constrained()->cascadeOnDelete();
            $table->enum('category', ['food', 'medical', 'clothing', 'bedding', 'hygiene', 'baby_supplies', 'other']);
            $table->text('description');
            $table->enum('urgency', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['pending', 'in_review', 'fulfilled', 'rejected'])->default('pending');
            $table->text('shelter_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->nullOnDelete()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('civilian_needs');
    }
};
