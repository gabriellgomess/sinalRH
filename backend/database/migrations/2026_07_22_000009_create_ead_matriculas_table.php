<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ead_matriculas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curso_id')->constrained('ead_cursos')->cascadeOnDelete();
            $table->foreignId('colaborador_id')->constrained('colaboradores')->cascadeOnDelete();
            $table->enum('status', ['nao_iniciado', 'em_andamento', 'concluido'])->default('nao_iniciado');
            $table->unsignedTinyInteger('progresso_pct')->default(0);
            $table->unsignedTinyInteger('nota_final')->nullable();
            $table->timestamp('iniciado_em')->nullable();
            $table->timestamp('concluido_em')->nullable();
            $table->timestamps();

            $table->unique(['curso_id', 'colaborador_id']);
            $table->index('colaborador_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ead_matriculas');
    }
};
