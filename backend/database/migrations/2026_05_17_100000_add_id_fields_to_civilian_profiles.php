<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('civilian_profiles', function (Blueprint $table) {
            $table->string('id_type')->nullable()->after('notes');      // national_id | passport | residency
            $table->string('id_number')->nullable()->after('id_type');  // the actual ID number
            $table->string('id_document_path')->nullable()->after('id_number'); // uploaded file path
        });
    }

    public function down(): void
    {
        Schema::table('civilian_profiles', function (Blueprint $table) {
            $table->dropColumn(['id_type', 'id_number', 'id_document_path']);
        });
    }
};
