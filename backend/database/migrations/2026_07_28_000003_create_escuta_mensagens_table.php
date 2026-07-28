<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Dialogo denunciante <-> equipe. Separada de escuta_notas de proposito:
        // notas sao internas; mensagens sao visiveis ao denunciante.
        Schema::create('escuta_mensagens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('relato_id')->constrained('relatos_escuta')->cascadeOnDelete();
            $table->string('autor', 12); // denunciante | equipe
            // Quem da equipe respondeu (auditoria interna) — NUNCA exposto na API publica
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('texto');
            $table->timestamp('lida_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('escuta_mensagens');
    }
};
