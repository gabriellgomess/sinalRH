<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ead_modulos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curso_id')->constrained('ead_cursos')->cascadeOnDelete();
            $table->string('titulo', 200);
            $table->text('descricao')->nullable();
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->timestamps();

            $table->index(['curso_id', 'ordem']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ead_modulos');
    }
};
