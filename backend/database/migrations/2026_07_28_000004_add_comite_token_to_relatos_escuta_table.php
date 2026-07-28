<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('relatos_escuta', function (Blueprint $table) {
            // Credencial do comite externo (link enviado por e-mail).
            // SEPARADA do protocolo: o protocolo e do denunciante; se fosse o mesmo,
            // quem denuncia poderia responder/encerrar o proprio caso como comite.
            $table->string('comite_token', 64)->nullable()->unique()->after('protocolo');
            $table->timestamp('comite_ultimo_acesso_em')->nullable()->after('comite_token');
        });
    }

    public function down(): void
    {
        Schema::table('relatos_escuta', function (Blueprint $table) {
            $table->dropColumn(['comite_token', 'comite_ultimo_acesso_em']);
        });
    }
};
