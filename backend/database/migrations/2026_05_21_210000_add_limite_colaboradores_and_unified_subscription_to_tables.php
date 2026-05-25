<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empresa_produtos', function (Blueprint $table) {
            $table->unsignedInteger('limite_colaboradores')->nullable()->after('quantidade_aplicacoes');
        });

        Schema::table('empresas', function (Blueprint $table) {
            $table->string('asaas_unified_subscription_id', 100)->nullable()->after('asaas_customer_id');
        });
    }

    public function down(): void
    {
        Schema::table('empresa_produtos', function (Blueprint $table) {
            $table->dropColumn('limite_colaboradores');
        });

        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn('asaas_unified_subscription_id');
        });
    }
};
