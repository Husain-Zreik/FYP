<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aid_schedules', function (Blueprint $table) {
            $table->id();
            $table->enum('level', ['government_shelter', 'shelter_civilian']);
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('shelter_id')->constrained()->cascadeOnDelete();
            $table->foreignId('civilian_id')->nullable()->nullOnDelete()->constrained('users');
            $table->foreignId('aid_category_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->enum('frequency', ['weekly', 'biweekly', 'monthly', 'quarterly']);
            $table->text('notes')->nullable();
            $table->date('starts_at');
            $table->date('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->date('last_sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aid_schedules');
    }
};
