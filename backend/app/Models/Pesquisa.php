<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pesquisa extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'empresa_id',
        'setor_id',   // null = todos os setores
        'criado_por',
        'titulo',
        'descricao',
        'tipo',       // clima | pulse | nps | risco | 360 | cultura
        'status',     // rascunho | ativa | encerrada | arquivada
        'anonima',
        'prazo',
        'publicado_em',
        'encerrado_em',
        'configuracoes', // JSON: lembrete, frequência, etc.
    ];

    protected $casts = [
        'anonima'        => 'boolean',
        'prazo'          => 'date',
        'publicado_em'   => 'datetime',
        'encerrado_em'   => 'datetime',
        'configuracoes'  => 'array',
        'empresa_id'     => 'integer',
        'setor_id'       => 'integer',
    ];

    // ── Relacionamentos ───────────────────────────────────────────────────
    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function setor()
    {
        return $this->belongsTo(Setor::class);
    }

    public function criador()
    {
        return $this->belongsTo(User::class, 'criado_por');
    }

    public function perguntas()
    {
        return $this->hasMany(Pergunta::class)->orderBy('ordem');
    }

    public function respostas()
    {
        return $this->hasManyThrough(Resposta::class, Pergunta::class);
    }

    // ── Scopes ───────────────────────────────────────────────────────────
    public function scopeAtivas($query)
    {
        return $query->where('status', 'ativa');
    }

    // ── Accessors ─────────────────────────────────────────────────────────
    public function getTaxaRespostaAttribute(): float
    {
        $total = $this->empresa->total_colaboradores;
        if ($total === 0) return 0;

        $responderam = $this->respostas()
            ->select('colaborador_id')
            ->distinct()
            ->count('colaborador_id');

        return round(($responderam / $total) * 100, 1);
    }

    public function getTotalRespostasAttribute(): int
    {
        return $this->respostas()
            ->select('colaborador_id')
            ->distinct()
            ->count('colaborador_id');
    }
}
