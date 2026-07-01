<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asaas_eventos', function (Blueprint $table) {
            $table->foreignId('empresa_cobranca_id')->nullable()->after('empresa_produto_id')->constrained('cobrancas')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('asaas_eventos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('empresa_cobranca_id');
        });
    }
};
