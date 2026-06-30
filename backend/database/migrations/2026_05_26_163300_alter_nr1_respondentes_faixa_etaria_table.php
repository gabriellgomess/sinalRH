<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const ANTIGOS = ['18_24', '25_34', '35_44', '45_54', '55_mais'];
    private const NOVOS   = ['menos_18', '19_34', '35_44', '45_mais'];
    private const AMBOS   = ['18_24', '25_34', '35_44', '45_54', '55_mais', 'menos_18', '19_34', '45_mais'];

    private function setEnum(array $valores): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // Laravel 11 reconstrói a tabela nativamente (atualiza o CHECK)
            Schema::table('nr1_respondentes', function (Blueprint $table) use ($valores) {
                $table->enum('faixa_etaria', $valores)->change();
            });
        } else {
            $lista = "'" . implode("', '", $valores) . "'";
            DB::statement("ALTER TABLE nr1_respondentes MODIFY COLUMN faixa_etaria ENUM($lista) NOT NULL");
        }
    }

    public function up(): void
    {
        // 1. Permite temporariamente valores antigos E novos (MySQL e SQLite)
        $this->setEnum(self::AMBOS);

        // 2. Mapeia registros existentes para as novas faixas
        DB::table('nr1_respondentes')->where('faixa_etaria', '18_24')->update(['faixa_etaria' => '19_34']);
        DB::table('nr1_respondentes')->where('faixa_etaria', '25_34')->update(['faixa_etaria' => '19_34']);
        DB::table('nr1_respondentes')->where('faixa_etaria', '45_54')->update(['faixa_etaria' => '45_mais']);
        DB::table('nr1_respondentes')->where('faixa_etaria', '55_mais')->update(['faixa_etaria' => '45_mais']);

        // 3. Restringe apenas aos novos valores
        $this->setEnum(self::NOVOS);
    }

    public function down(): void
    {
        $this->setEnum(self::AMBOS);

        DB::table('nr1_respondentes')->where('faixa_etaria', '19_34')->update(['faixa_etaria' => '25_34']);
        DB::table('nr1_respondentes')->where('faixa_etaria', 'menos_18')->update(['faixa_etaria' => '18_24']);
        DB::table('nr1_respondentes')->where('faixa_etaria', '45_mais')->update(['faixa_etaria' => '45_54']);

        $this->setEnum(self::ANTIGOS);
    }
};
