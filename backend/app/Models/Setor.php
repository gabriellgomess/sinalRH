<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Setor extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'setores';

    protected $fillable = [
        'empresa_id',
        'setor_pai_id',
        'nome',
        'unidade',
        'responsavel',
        'descricao',
        'responsavel_id',
        'nivel',
    ];

    protected $casts = [
        'empresa_id'    => 'integer',
        'setor_pai_id'  => 'integer',
        'responsavel_id'=> 'integer',
    ];

    // ── Relacionamentos ───────────────────────────────────────────────────
    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function pai()
    {
        return $this->belongsTo(Setor::class, 'setor_pai_id');
    }

    public function filhos()
    {
        return $this->hasMany(Setor::class, 'setor_pai_id');
    }

    public function responsavel()
    {
        return $this->belongsTo(User::class, 'responsavel_id');
    }

    public function colaboradores()
    {
        return $this->hasMany(Colaborador::class);
    }

    public function riscos()
    {
        return $this->hasMany(Risco::class);
    }

    public function ultimoRisco()
    {
        return $this->hasOne(Risco::class)->latestOfMany();
    }

    // ── Accessors ─────────────────────────────────────────────────────────
    public function getNivelRiscoAttribute(): string
    {
        $risco = $this->ultimoRisco;
        return $risco?->nivel ?? 'sem_dados';
    }
}
