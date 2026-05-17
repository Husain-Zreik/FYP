<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('civilian_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->string('current_location')->nullable();
            $table->text('notes')->nullable();
            $table->string('id_type')->nullable();
            $table->string('id_number')->nullable();
            $table->string('id_document_path')->nullable();
            $table->enum('housing_status', ['shelter', 'private', 'seeking'])->default('seeking');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('civilian_profiles');
    }
};
