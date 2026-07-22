<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ead_aula_progresso', function (Blueprint $table) {
            $table->id();
            $table->foreignId('matricula_id')->constrained('ead_matriculas')->cascadeOnDelete();
            $table->foreignId('aula_id')->constrained('ead_aulas')->cascadeOnDelete();
            $table->timestamp('concluida_em')->nullable();
            $table->unsignedInteger('segundos_assistidos')->nullable();
            $table->timestamps();

            $table->unique(['matricula_id', 'aula_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ead_aula_progresso');
    }
};
