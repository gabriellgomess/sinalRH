<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('setores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained()->cascadeOnDelete();
            $table->foreignId('setor_pai_id')->nullable()->constrained('setores')->nullOnDelete();
            $table->foreignId('responsavel_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nome');
            $table->string('unidade')->nullable();
            $table->string('responsavel')->nullable();
            $table->string('descricao')->nullable();
            $table->enum('nivel', ['unidade', 'setor', 'time'])->default('setor');
            $table->softDeletes();
            $table->timestamps();

            $table->index(['empresa_id', 'nivel']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('setores');
    }
};
