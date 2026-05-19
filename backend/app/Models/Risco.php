<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Risco extends Model
{
    use HasFactory;

    protected $fillable = [
        'setor_id',
        'empresa_id',
        'periodo',
        'nivel',
        'score',
        'dimensoes',
        'recomendacao_titulo',
        'recomendacao_texto',
        'gerado_por_ia',
        'validado_por',
        'validado_em',
        'metadados',
    ];

    protected $casts = [
        'dimensoes'      => 'array',
        'metadados'      => 'array',
        'score'          => 'float',
        'gerado_por_ia'  => 'boolean',
        'validado_por'   => 'integer',
        'setor_id'       => 'integer',
        'empresa_id'     => 'integer',
        'validado_em'    => 'datetime',
    ];

    // ── Dimensões psicossociais mapeadas (ISO 45003) ───────────────────
    public const DIMENSOES = [
        'demanda'         => 'Demanda de trabalho',
        'lideranca'       => 'Qualidade da liderança',
        'clareza'         => 'Clareza de papel',
        'autonomia'       => 'Autonomia',
        'reconhecimento'  => 'Reconhecimento',
        'comunicacao'     => 'Comunicação',
        'conflitos'       => 'Conflitos interpessoais',
        'apoio_social'    => 'Apoio social',
    ];

    // ── Relacionamentos ───────────────────────────────────────────────────
    public function setor()
    {
        return $this->belongsTo(Setor::class);
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function validador()
    {
        return $this->belongsTo(User::class, 'validado_por');
    }

    // ── Scopes ───────────────────────────────────────────────────────────
    public function scopeCriticos($query)
    {
        return $query->whereIn('nivel', ['critico', 'alto']);
    }

    // ── Accessors ─────────────────────────────────────────────────────────
    public function getDimensaoCriticaAttribute(): ?string
    {
        if (!$this->dimensoes) return null;
        return collect($this->dimensoes)
            ->sortKeys()
            ->keys()
            ->first();
    }
}
