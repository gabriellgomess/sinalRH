<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('colaboradores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('setor_id')->nullable()->constrained('setores')->nullOnDelete();
            $table->string('nome');
            $table->string('email')->unique();
            $table->string('cpf', 14)->nullable()->unique();
            $table->string('codigo_acesso', 12)->unique();
            $table->string('password');
            $table->string('cargo')->nullable();
            $table->date('data_admissao')->nullable();
            $table->enum('status', ['ativo', 'afastado', 'desligado'])->default('ativo');
            $table->string('token_fcm')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['empresa_id', 'status']);
            $table->index(['setor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('colaboradores');
    }
};
