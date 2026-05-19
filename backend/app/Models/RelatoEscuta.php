<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RelatoEscuta extends Model
{
    use HasFactory;

    protected $table = 'relatos_escuta';

    protected $fillable = [
        'empresa_id',
        'colaborador_id', // null se anônimo
        'setor_id',       // setor do colaborador ou informado
        'modo',           // anonimo | identificado
        'categoria',      // sobrecarga | assedio | lideranca | comunicacao | sugestao | outro
        'tag',
        'texto',
        'status',         // pendente | em_analise | resolvido | arquivado
        'prioridade',     // baixa | media | alta | critica
        'nota_interna',   // notas da equipe de RH (não visível ao colaborador)
        'atendido_por',   // User ID
        'atendido_em',
    ];

    protected $casts = [
        'empresa_id'     => 'integer',
        'colaborador_id' => 'integer',
        'setor_id'       => 'integer',
        'atendido_por'   => 'integer',
        'atendido_em'    => 'datetime',
    ];

    protected $hidden = ['colaborador_id', 'nota_interna']; // proteger identidade por padrão

    // ── Relacionamentos ───────────────────────────────────────────────────
    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class);
    }

    public function setor()
    {
        return $this->belongsTo(Setor::class);
    }

    public function atendente()
    {
        return $this->belongsTo(User::class, 'atendido_por');
    }

    // ── Scopes ───────────────────────────────────────────────────────────
    public function scopePendentes($query)
    {
        return $query->where('status', 'pendente');
    }

    public function scopeCriticos($query)
    {
        return $query->where('prioridade', 'critica');
    }
}
