<?php

namespace App\Policies;

use App\Models\Pesquisa;
use App\Models\User;

class PesquisaPolicy
{
    public function view(User $user, Pesquisa $pesquisa): bool
    {
        return $this->sameEmpresa($user, $pesquisa->empresa_id);
    }

    public function update(User $user, Pesquisa $pesquisa): bool
    {
        return $this->sameEmpresa($user, $pesquisa->empresa_id)
            && in_array($user->perfil, ['admin', 'gestor'], true);
    }

    public function delete(User $user, Pesquisa $pesquisa): bool
    {
        return $this->sameEmpresa($user, $pesquisa->empresa_id)
            && $user->perfil === 'admin';
    }

    private function sameEmpresa(User $user, int $empresaId): bool
    {
        if ($user->perfil === 'super_admin') {
            return true;
        }

        return (int) $user->empresa_id === $empresaId;
    }
}
