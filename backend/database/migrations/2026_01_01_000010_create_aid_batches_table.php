<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aid_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aid_category_id')->constrained()->cascadeOnDelete();
            $table->string('source');
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('available_quantity');
            $table->text('notes')->nullable();
            $table->date('received_at');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aid_batches');
    }
};
