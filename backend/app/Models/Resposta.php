<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Resposta extends Model
{
    use HasFactory;

    protected $fillable = [
        'pergunta_id',
        'colaborador_id',
        'valor_numerico',  // 1-5 para likert, 0-10 para NPS, null para texto
        'valor_texto',     // resposta em texto livre
        'valor_opcao',     // para múltipla escolha (índice da opção)
        'ip_hash',         // hash do IP para detecção de duplicatas (sem identificar)
    ];

    protected $casts = [
        'valor_numerico' => 'float',
        'pergunta_id'    => 'integer',
        'colaborador_id' => 'integer',
    ];

    // ── Relacionamentos ───────────────────────────────────────────────────
    public function pergunta()
    {
        return $this->belongsTo(Pergunta::class);
    }

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class);
    }
}
