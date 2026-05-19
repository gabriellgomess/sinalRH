<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empresas', function (Blueprint $table) {
            $table->id();
            $table->string('razao_social');
            $table->string('nome_fantasia')->nullable();
            $table->string('cnpj', 18)->unique();
            $table->string('segmento')->nullable();
            $table->enum('porte', ['micro', 'pequeno', 'medio', 'grande'])->default('medio');
            $table->enum('plano', ['free', 'starter', 'pleno', 'enterprise'])->default('starter');
            $table->enum('status', ['ativo', 'suspenso', 'cancelado'])->default('ativo');
            $table->string('logo_path')->nullable();
            $table->string('email_contato')->nullable();
            $table->string('telefone', 20)->nullable();
            $table->string('consultor_slc')->nullable();
            $table->unsignedInteger('max_colaboradores')->default(100);
            $table->json('configuracoes')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empresas');
    }
};
