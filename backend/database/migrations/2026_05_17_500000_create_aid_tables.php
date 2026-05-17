<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aid_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('unit')->default('units');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('aid_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aid_category_id')->constrained('aid_categories')->cascadeOnDelete();
            $table->string('source');
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('available_quantity');
            $table->text('notes')->nullable();
            $table->date('received_at');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('aid_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shelter_id')->constrained('shelters')->cascadeOnDelete();
            $table->foreignId('aid_category_id')->constrained('aid_categories')->cascadeOnDelete();
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

        Schema::create('civilian_needs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('civilian_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('shelter_id')->constrained('shelters')->cascadeOnDelete();
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
        Schema::dropIfExists('aid_requests');
        Schema::dropIfExists('aid_batches');
        Schema::dropIfExists('aid_categories');
    }
};
