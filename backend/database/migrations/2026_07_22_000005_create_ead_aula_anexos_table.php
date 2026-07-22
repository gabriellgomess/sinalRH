<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ead_aula_anexos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aula_id')->constrained('ead_aulas')->cascadeOnDelete();
            $table->string('nome_original');
            $table->string('caminho_storage');
            $table->string('mime', 120)->nullable();
            $table->unsignedBigInteger('tamanho_bytes')->default(0);
            $table->enum('categoria', ['imagem', 'documento'])->default('documento');
            $table->foreignId('enviado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('aula_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ead_aula_anexos');
    }
};
