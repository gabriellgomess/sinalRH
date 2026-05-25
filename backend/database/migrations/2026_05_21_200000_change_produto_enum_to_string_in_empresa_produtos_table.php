<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empresa_produtos', function (Blueprint $table) {
            $table->string('produto', 100)->change();
        });
    }

    public function down(): void
    {
        Schema::table('empresa_produtos', function (Blueprint $table) {
            $table->enum('produto', ['diagnostico_nr1', 'plano_acao_nr1', 'canal_escuta'])->change();
        });
    }
};
