<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckIn extends Model
{
    use HasFactory;

    protected $table = 'checkins';

    protected $fillable = [
        'colaborador_id',
        'empresa_id',
        'setor_id',
        'humor',        // 1-5 (1=muito ruim, 5=muito bem)
        'comentario',   // texto livre (opcional)
        'semana',       // ISO week (ex: 2026-W20)
        'anonimo',
    ];

    protected $casts = [
        'humor'          => 'integer',
        'anonimo'        => 'boolean',
        'colaborador_id' => 'integer',
        'empresa_id'     => 'integer',
        'setor_id'       => 'integer',
    ];

    // ── Relacionamentos ───────────────────────────────────────────────────
    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class);
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function setor()
    {
        return $this->belongsTo(Setor::class);
    }

    // ── Scopes ───────────────────────────────────────────────────────────
    public function scopeDaSemana($query, string $semana)
    {
        return $query->where('semana', $semana);
    }

    public function scopeDoColaborador($query, int $colaboradorId)
    {
        return $query->where('colaborador_id', $colaboradorId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    public static function semanaAtual(): string
    {
        return now()->format('o-\WW'); // ex: 2026-W20
    }

    public function getHumorLabelAttribute(): string
    {
        return match ($this->humor) {
            5 => 'Muito bem',
            4 => 'Bem',
            3 => 'Neutro',
            2 => 'Pouco bem',
            1 => 'Nada bem',
            default => 'Não informado',
        };
    }
}
