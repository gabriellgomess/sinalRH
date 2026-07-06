<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nr1_plano_acoes', function (Blueprint $table) {
            $table->date('data_inicio')->nullable()->after('responsavel_cargo');
        });
    }

    public function down(): void
    {
        Schema::table('nr1_plano_acoes', function (Blueprint $table) {
            $table->dropColumn('data_inicio');
        });
    }
};
