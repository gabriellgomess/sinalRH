<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Temporarily allow BOTH old and new enum values in MySQL
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE nr1_respondentes MODIFY COLUMN faixa_etaria ENUM('18_24', '25_34', '35_44', '45_54', '55_mais', 'menos_18', '19_34', '45_mais') NOT NULL");
        }

        // 2. Map existing records to the new age groups safely
        DB::table('nr1_respondentes')->where('faixa_etaria', '18_24')->update(['faixa_etaria' => '19_34']);
        DB::table('nr1_respondentes')->where('faixa_etaria', '25_34')->update(['faixa_etaria' => '19_34']);
        DB::table('nr1_respondentes')->where('faixa_etaria', '45_54')->update(['faixa_etaria' => '45_mais']);
        DB::table('nr1_respondentes')->where('faixa_etaria', '55_mais')->update(['faixa_etaria' => '45_mais']);

        // 3. Finalize constraint by restricting only to the new categories
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE nr1_respondentes MODIFY COLUMN faixa_etaria ENUM('menos_18', '19_34', '35_44', '45_mais') NOT NULL");
        }
    }

    public function down(): void
    {
        // Revert enum column to include both to allow mapping down if needed
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE nr1_respondentes MODIFY COLUMN faixa_etaria ENUM('18_24', '25_34', '35_44', '45_54', '55_mais', 'menos_18', '19_34', '45_mais') NOT NULL");
        }

        // Map back (simplistic down mapping)
        DB::table('nr1_respondentes')->where('faixa_etaria', '19_34')->update(['faixa_etaria' => '25_34']);
        DB::table('nr1_respondentes')->where('faixa_etaria', 'menos_18')->update(['faixa_etaria' => '18_24']);
        DB::table('nr1_respondentes')->where('faixa_etaria', '45_mais')->update(['faixa_etaria' => '45_54']);

        // Restrict strictly to old enum values
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE nr1_respondentes MODIFY COLUMN faixa_etaria ENUM('18_24', '25_34', '35_44', '45_54', '55_mais') NOT NULL");
        }
    }
};
