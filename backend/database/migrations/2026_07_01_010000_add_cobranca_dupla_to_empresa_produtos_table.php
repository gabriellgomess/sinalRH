<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const ANTIGOS = ['pontual', 'recorrente_mensal'];
    private const NOVOS   = ['unica', 'recorrente', 'ambas'];
    private const AMBOS   = ['pontual', 'recorrente_mensal', 'unica', 'recorrente', 'ambas'];

    private function setTipoEnum(array $valores): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('empresa_produtos', function (Blueprint $table) use ($valores) {
                $table->enum('tipo', $valores)->change();
            });
        } else {
            $lista = "'" . implode("', '", $valores) . "'";
            DB::statement("ALTER TABLE empresa_produtos MODIFY COLUMN tipo ENUM($lista) NOT NULL");
        }
    }

    public function up(): void
    {
        if (!Schema::hasColumn('empresa_produtos', 'valor_unico')) {
            Schema::table('empresa_produtos', function (Blueprint $table) {
                $table->decimal('valor_unico', 10, 2)->nullable()->after('valor_unitario');
            });
        }

        // pontual -> unica | recorrente_mensal -> recorrente | + ambas
        $this->setTipoEnum(self::AMBOS);
        DB::table('empresa_produtos')->where('tipo', 'pontual')->update(['tipo' => 'unica']);
        DB::table('empresa_produtos')->where('tipo', 'recorrente_mensal')->update(['tipo' => 'recorrente']);
        $this->setTipoEnum(self::NOVOS);
    }

    public function down(): void
    {
        $this->setTipoEnum(self::AMBOS);
        DB::table('empresa_produtos')->where('tipo', 'unica')->update(['tipo' => 'pontual']);
        DB::table('empresa_produtos')->whereIn('tipo', ['recorrente', 'ambas'])->update(['tipo' => 'recorrente_mensal']);
        $this->setTipoEnum(self::ANTIGOS);

        if (Schema::hasColumn('empresa_produtos', 'valor_unico')) {
            Schema::table('empresa_produtos', function (Blueprint $table) {
                $table->dropColumn('valor_unico');
            });
        }
    }
};
