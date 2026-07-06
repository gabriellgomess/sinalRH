<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Produto virou ACESSO (sem cobranca). A coluna 'tipo' (billing legado) deixa
    // de ser preenchida no cadastro, entao precisa aceitar null.
    public function up(): void
    {
        Schema::table('empresa_produtos', function (Blueprint $table) {
            $table->string('tipo')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('empresa_produtos', function (Blueprint $table) {
            $table->string('tipo')->nullable(false)->change();
        });
    }
};
