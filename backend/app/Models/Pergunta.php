<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pergunta extends Model
{
    use HasFactory;

    protected $fillable = [
        'pesquisa_id',
        'texto',
        'tipo',        // likert | multipla_escolha | sim_nao | nps | texto_livre
        'dimensao',    // liderança | comunicação | carga_trabalho | reconhecimento | etc.
        'ordem',
        'obrigatoria',
        'opcoes',      // JSON: para múltipla escolha
    ];

    protected $casts = [
        'obrigatoria' => 'boolean',
        'opcoes'      => 'array',
        'ordem'       => 'integer',
        'pesquisa_id' => 'integer',
    ];

    // ── Relacionamentos ───────────────────────────────────────────────────
    public function pesquisa()
    {
        return $this->belongsTo(Pesquisa::class);
    }

    public function respostas()
    {
        return $this->hasMany(Resposta::class);
    }

    // ── Accessors ─────────────────────────────────────────────────────────
    public function getMediaRespostasAttribute(): float
    {
        return round($this->respostas()->avg('valor_numerico') ?? 0, 2);
    }
}
