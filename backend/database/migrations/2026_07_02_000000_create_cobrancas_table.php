<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cobrancas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->enum('tipo', ['unica', 'recorrente']);
            $table->string('descricao', 200);
            $table->decimal('valor', 10, 2);
            $table->string('ciclo', 20)->nullable(); // apenas recorrente
            $table->enum('billing_type', ['BOLETO', 'PIX', 'CREDIT_CARD', 'UNDEFINED'])->default('UNDEFINED');
            $table->date('vencimento')->nullable();
            $table->enum('status', ['pendente', 'ativa', 'paga', 'atrasada', 'cancelada'])->default('pendente');
            $table->string('asaas_payment_id', 50)->nullable();
            $table->string('asaas_subscription_id', 50)->nullable();
            $table->string('asaas_invoice_url', 500)->nullable();
            $table->json('asaas_metadata')->nullable();
            $table->text('observacoes')->nullable();
            $table->foreignId('criado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('asaas_ultima_sincronizacao_em')->nullable();
            $table->timestamps();

            $table->index(['empresa_id', 'status']);
            $table->index('asaas_payment_id');
            $table->index('asaas_subscription_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cobrancas');
    }
};
