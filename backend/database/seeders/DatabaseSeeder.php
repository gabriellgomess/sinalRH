<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'nome'       => env('ADMIN_NOME', 'Administrador'),
            'email'      => env('ADMIN_EMAIL', 'admin@radarapessoas.com.br'),
            'password'   => Hash::make(env('ADMIN_PASSWORD', 'trocar@123')),
            'perfil'     => 'super_admin',
            'empresa_id' => null,
            'ativo'      => true,
        ]);
    }
}
