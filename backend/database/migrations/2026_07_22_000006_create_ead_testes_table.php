<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ead_testes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curso_id')->constrained('ead_cursos')->cascadeOnDelete();
            $table->foreignId('modulo_id')->nullable()->constrained('ead_modulos')->nullOnDelete();
            $table->string('titulo', 200);
            $table->text('descricao')->nullable();
            $table->unsignedTinyInteger('nota_minima')->default(70); // 0..100
            $table->unsignedSmallInteger('tentativas_max')->nullable(); // null = ilimitado
            $table->boolean('embaralhar')->default(false);
            $table->boolean('obrigatorio_aprovacao')->default(true); // trava conclusao do curso
            $table->timestamps();

            $table->index('curso_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ead_testes');
    }
};
