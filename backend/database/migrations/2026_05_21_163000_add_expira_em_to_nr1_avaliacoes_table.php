<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('nr1_avaliacoes', function (Blueprint $table) {
            $table->date('expira_em')->nullable()->default(null)->after('proxima_avaliacao_em');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('nr1_avaliacoes', function (Blueprint $table) {
            $table->dropColumn('expira_em');
        });
    }
};
