<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Single consolidated migration — creates every table in dependency order.
 * Run: php artisan migrate:refresh --seed
 */
return new class extends Migration
{
    public function up(): void
    {
        // Drop in reverse dependency order first (safe for migrate:fresh)
        $this->down();

        // ── 1. Shelters ───────────────────────────────────────────────────────
        Schema::create('shelters', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable()->unique();
            $table->string('governorate');
            $table->string('district')->nullable();
            $table->string('address');
            $table->decimal('latitude',  10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->unsignedInteger('capacity');
            $table->unsignedInteger('rooms')->nullable();
            $table->enum('status', ['active', 'inactive', 'full', 'under_maintenance'])->default('active');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── 2. Users ──────────────────────────────────────────────────────────
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shelter_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->enum('role', [
                'government_admin',
                'government_staff',
                'shelter_admin',
                'shelter_staff',
                'civilian',
            ])->default('civilian');
            $table->boolean('is_active')->default(true);
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // ── 3. Laravel internals ──────────────────────────────────────────────
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // ── 4. Civilian profiles ──────────────────────────────────────────────
        Schema::create('civilian_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->string('current_location')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── 5. Shelter requests / invitations ─────────────────────────────────
        Schema::create('shelter_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('civilian_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('shelter_id')->constrained()->cascadeOnDelete();
            $table->enum('type',   ['invitation', 'request']);
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
        Schema::dropIfExists('civilian_profiles');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('shelters');
    }
};
