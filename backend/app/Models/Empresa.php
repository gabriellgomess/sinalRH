<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Empresa extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'razao_social',
        'nome_fantasia',
        'cnpj',
        'segmento',
        'porte',
        'plano',        // free | starter | pleno | enterprise
        'status',       // ativo | suspenso | cancelado
        'logo_path',
        'email_contato',
        'telefone',
        'consultor_slc',
        'max_colaboradores',
        'configuracoes',        // JSON
        'onboarding_concluido',
        'asaas_customer_id',
        'asaas_sincronizado_em',
    ];

    protected $casts = [
        'configuracoes'        => 'array',
        'onboarding_concluido' => 'boolean',
        'asaas_sincronizado_em' => 'datetime',
    ];

    // ── Relacionamentos ───────────────────────────────────────────────────
    public function setores()
    {
        return $this->hasMany(Setor::class);
    }

    public function colaboradores()
    {
        return $this->hasMany(Colaborador::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function pesquisas()
    {
        return $this->hasMany(Pesquisa::class);
    }

    public function comunicados()
    {
        return $this->hasMany(Comunicado::class);
    }

    public function relatorios()
    {
        return $this->hasMany(Relatorio::class);
    }

    public function produtos()
    {
        return $this->hasMany(EmpresaProduto::class);
    }

    // ── Scopes ───────────────────────────────────────────────────────────
    public function scopeAtivas($query)
    {
        return $query->where('status', 'ativo');
    }

    // ── Accessors ─────────────────────────────────────────────────────────
    public function getTotalColaboradoresAttribute(): int
    {
        return $this->colaboradores()->where('status', 'ativo')->count();
    }
}
