<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asaas_eventos', function (Blueprint $table) {
            $table->id();
            $table->string('asaas_event_id', 80)->unique();
            $table->string('event_type', 80);
            $table->foreignId('empresa_produto_id')->nullable()->constrained('empresa_produtos')->nullOnDelete();
            $table->json('payload');
            $table->enum('resultado', ['processed', 'skipped', 'failed'])->default('skipped');
            $table->text('erro')->nullable();
            $table->timestamp('processado_em')->nullable();
            $table->timestamps();

            $table->index(['event_type', 'resultado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asaas_eventos');
    }
};
