<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->string('escuta_slug', 60)->nullable()->unique()->after('escuta_comite_nome');
            $table->boolean('escuta_publica_ativa')->default(false)->after('escuta_slug');
        });
    }

    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn(['escuta_slug', 'escuta_publica_ativa']);
        });
    }
};
