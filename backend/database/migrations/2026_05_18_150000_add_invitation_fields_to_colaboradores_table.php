<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('colaboradores', function (Blueprint $table) {
            $table->string('convite_token', 100)->nullable()->unique()->after('password');
            $table->timestamp('convite_expira_em')->nullable()->after('convite_token');
            $table->timestamp('convite_aceito_em')->nullable()->after('convite_expira_em');
        });
    }

    public function down(): void
    {
        Schema::table('colaboradores', function (Blueprint $table) {
            $table->dropColumn(['convite_token', 'convite_expira_em', 'convite_aceito_em']);
        });
    }
};
