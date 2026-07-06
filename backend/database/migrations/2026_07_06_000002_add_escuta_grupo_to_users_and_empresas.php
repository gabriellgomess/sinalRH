<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Grupo de tratamento de denuncias (canal de escuta). null = nao trata escuta.
            $table->string('grupo_escuta', 20)->nullable()->after('perfil');
        });

        Schema::table('empresas', function (Blueprint $table) {
            // Fallback do topo: comite/conselho externo (denuncia envolvendo a Presidencia).
            $table->string('escuta_comite_email', 150)->nullable();
            $table->string('escuta_comite_nome', 150)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('grupo_escuta');
        });
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn(['escuta_comite_email', 'escuta_comite_nome']);
        });
    }
};
