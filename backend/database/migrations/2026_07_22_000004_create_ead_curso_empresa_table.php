<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ead_curso_empresa', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curso_id')->constrained('ead_cursos')->cascadeOnDelete();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->boolean('ativo')->default(true);
            $table->foreignId('setor_id')->nullable()->constrained('setores')->nullOnDelete(); // restringe a um setor
            $table->date('prazo')->nullable();          // prazo especifico desta empresa
            $table->timestamp('liberado_em')->nullable();
            $table->foreignId('liberado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['curso_id', 'empresa_id']);
            $table->index(['empresa_id', 'ativo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ead_curso_empresa');
    }
};
