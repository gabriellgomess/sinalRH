<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Trilha de auditoria: quem visualizou/agiu sobre cada relato, quando.
    public function up(): void
    {
        Schema::create('escuta_acessos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('relato_id')->constrained('relatos_escuta')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('acao', 30); // visualizou | assumiu | mudou_status | adicionou_nota | arquivou
            $table->string('detalhe', 100)->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['relato_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('escuta_acessos');
    }
};
