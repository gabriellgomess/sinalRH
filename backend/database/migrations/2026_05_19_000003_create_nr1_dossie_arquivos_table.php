<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nr1_dossie_arquivos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('avaliacao_id')->constrained('nr1_avaliacoes')->cascadeOnDelete();
            $table->string('pasta_codigo', 2);     // '00' .. '10'
            $table->string('subpasta', 50)->nullable(); // ex: 'Mes_1' (so usado em pasta 06)
            $table->string('nome_original', 255);
            $table->string('caminho_storage', 500);
            $table->unsignedInteger('tamanho_bytes');
            $table->string('mime_type', 100);
            $table->text('descricao')->nullable();
            $table->foreignId('enviado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['avaliacao_id', 'pasta_codigo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nr1_dossie_arquivos');
    }
};
