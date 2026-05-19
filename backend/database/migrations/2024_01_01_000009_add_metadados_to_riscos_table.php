<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('riscos', function (Blueprint $table) {
            $table->json('metadados')->nullable()->after('validado_em');
        });
    }

    public function down(): void
    {
        Schema::table('riscos', function (Blueprint $table) {
            $table->dropColumn('metadados');
        });
    }
};
