<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('relatos_escuta', function (Blueprint $table) {
            $table->string('tipo_envolvido', 30)->nullable()->after('categoria');
            $table->foreignId('setor_denunciado_id')->nullable()->after('tipo_envolvido')->constrained('setores')->nullOnDelete();
            $table->foreignId('usuario_denunciado_id')->nullable()->after('setor_denunciado_id')->constrained('users')->nullOnDelete();
            $table->string('cargo_nivel_denunciado', 150)->nullable()->after('usuario_denunciado_id');
            $table->string('grupo_destino', 20)->default('rh')->after('cargo_nivel_denunciado');
            $table->string('nivel_sigilo', 10)->default('padrao')->after('grupo_destino');

            $table->index(['empresa_id', 'grupo_destino', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('relatos_escuta', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'grupo_destino', 'status']);
            $table->dropConstrainedForeignId('setor_denunciado_id');
            $table->dropConstrainedForeignId('usuario_denunciado_id');
            $table->dropColumn(['tipo_envolvido', 'cargo_nivel_denunciado', 'grupo_destino', 'nivel_sigilo']);
        });
    }
};
