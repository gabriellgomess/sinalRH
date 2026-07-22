<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ead_aulas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('modulo_id')->constrained('ead_modulos')->cascadeOnDelete();
            $table->string('titulo', 200);
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->enum('tipo', ['video_upload', 'video_youtube', 'texto', 'documento'])->default('texto');
            $table->longText('conteudo')->nullable();          // texto rico (HTML sanitizado)
            $table->string('video_storage')->nullable();       // caminho do arquivo no disk local
            $table->string('video_youtube_id', 32)->nullable();// apenas o ID do video
            $table->unsignedInteger('duracao_seg')->nullable();
            $table->timestamps();

            $table->index(['modulo_id', 'ordem']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ead_aulas');
    }
};
