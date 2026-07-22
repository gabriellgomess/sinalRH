<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ead_cursos', function (Blueprint $table) {
            $table->id();
            // Curso e GLOBAL: pertence a plataforma (Sara Linhar), sem empresa_id.
            $table->foreignId('criado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->string('titulo', 200);
            $table->text('descricao')->nullable();
            $table->string('capa_storage')->nullable();
            $table->enum('status', ['rascunho', 'publicado', 'arquivado'])->default('rascunho');
            $table->boolean('obrigatorio')->default(false);
            $table->unsignedSmallInteger('carga_horaria_min')->nullable();
            $table->unsignedSmallInteger('prazo_dias')->nullable(); // prazo padrao em dias apos liberacao
            $table->timestamp('publicado_em')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ead_cursos');
    }
};
