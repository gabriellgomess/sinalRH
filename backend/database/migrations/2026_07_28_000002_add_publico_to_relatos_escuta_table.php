<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('relatos_escuta', function (Blueprint $table) {
            // interno = via app logado | publico = via pagina sem login
            $table->string('origem', 10)->default('interno')->after('modo');
            // Protocolo de acompanhamento (credencial do denunciante — alta entropia)
            $table->string('protocolo', 20)->nullable()->unique()->after('origem');
            // E-mail OPCIONAL do denunciante, apenas para aviso de resposta.
            // Guardado CIFRADO (cast 'encrypted' no model) e nunca exposto ao painel.
            $table->text('email_notificacao')->nullable()->after('texto');
        });
    }

    public function down(): void
    {
        Schema::table('relatos_escuta', function (Blueprint $table) {
            $table->dropColumn(['origem', 'protocolo', 'email_notificacao']);
        });
    }
};
