<?php

namespace App\Policies;

use App\Models\Relatorio;
use App\Models\User;

class RelatorioPolicy
{
    public function view(User $user, Relatorio $relatorio): bool
    {
        return $this->sameEmpresa($user, $relatorio->empresa_id);
    }

    public function update(User $user, Relatorio $relatorio): bool
    {
        return $this->sameEmpresa($user, $relatorio->empresa_id)
            && in_array($user->perfil, ['admin', 'gestor', 'consultor'], true);
    }

    public function delete(User $user, Relatorio $relatorio): bool
    {
        return $this->sameEmpresa($user, $relatorio->empresa_id)
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
