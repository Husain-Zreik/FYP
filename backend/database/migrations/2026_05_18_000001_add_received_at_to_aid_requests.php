<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('aid_requests', function (Blueprint $table) {
            $table->date('received_at')->nullable()->after('reviewed_at');
            $table->text('shelter_received_notes')->nullable()->after('received_at');
        });
    }

    public function down(): void
    {
        Schema::table('aid_requests', function (Blueprint $table) {
            $table->dropColumn(['received_at', 'shelter_received_notes']);
        });
    }
};
