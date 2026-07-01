<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->string('cnpj', 18)->nullable()->change();
        });

        // Normaliza CNPJ vazio para null (evita colisao no indice unico)
        DB::table('empresas')->where('cnpj', '')->update(['cnpj' => null]);
    }

    public function down(): void
    {
        DB::table('empresas')->whereNull('cnpj')->update(['cnpj' => '']);

        Schema::table('empresas', function (Blueprint $table) {
            $table->string('cnpj', 18)->nullable(false)->change();
        });
    }
};
