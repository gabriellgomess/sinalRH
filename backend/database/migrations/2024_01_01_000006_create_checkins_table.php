<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checkins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('colaborador_id')->constrained('colaboradores')->cascadeOnDelete();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('setor_id')->nullable()->constrained('setores')->nullOnDelete();
            $table->unsignedTinyInteger('humor'); // 1-5
            $table->text('comentario')->nullable();
            $table->string('semana', 10); // ex: 2026-W20
            $table->boolean('anonimo')->default(false);
            $table->timestamps();

            $table->unique(['colaborador_id', 'semana']);
            $table->index(['empresa_id', 'semana']);
            $table->index(['setor_id', 'semana']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checkins');
    }
};
