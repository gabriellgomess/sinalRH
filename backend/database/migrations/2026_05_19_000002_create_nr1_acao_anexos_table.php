<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nr1_acao_anexos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('acao_id')->constrained('nr1_plano_acoes')->cascadeOnDelete();
            $table->string('nome_original', 255);
            $table->string('caminho_storage', 500);
            $table->unsignedInteger('tamanho_bytes');
            $table->string('mime_type', 100);
            $table->text('descricao')->nullable();
            $table->foreignId('enviado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nr1_acao_anexos');
    }
};
