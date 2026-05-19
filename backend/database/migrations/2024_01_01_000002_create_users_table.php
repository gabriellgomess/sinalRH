<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained()->nullOnDelete();
            $table->string('nome');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('cargo')->nullable();
            $table->enum('perfil', ['super_admin', 'admin', 'gestor', 'consultor', 'leitura'])->default('gestor');
            $table->string('iniciais', 3)->nullable();
            $table->string('avatar_path')->nullable();
            $table->boolean('ativo')->default(true);
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
