<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->string('asaas_customer_id', 50)->nullable()->after('logo_path');
            $table->timestamp('asaas_sincronizado_em')->nullable()->after('asaas_customer_id');
            $table->index('asaas_customer_id');
        });

        Schema::table('empresa_produtos', function (Blueprint $table) {
            $table->string('asaas_subscription_id', 50)->nullable()->after('contratado_por');
            $table->string('asaas_payment_id', 50)->nullable()->after('asaas_subscription_id');
            $table->string('asaas_invoice_url', 500)->nullable()->after('asaas_payment_id');
            $table->json('asaas_metadata')->nullable()->after('asaas_invoice_url');
            $table->timestamp('asaas_ultima_sincronizacao_em')->nullable()->after('asaas_metadata');
            $table->index('asaas_subscription_id');
            $table->index('asaas_payment_id');
        });
    }

    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropIndex(['asaas_customer_id']);
            $table->dropColumn(['asaas_customer_id', 'asaas_sincronizado_em']);
        });

        Schema::table('empresa_produtos', function (Blueprint $table) {
            $table->dropIndex(['asaas_subscription_id']);
            $table->dropIndex(['asaas_payment_id']);
            $table->dropColumn([
                'asaas_subscription_id',
                'asaas_payment_id',
                'asaas_invoice_url',
                'asaas_metadata',
                'asaas_ultima_sincronizacao_em',
            ]);
        });
    }
};
