<?php

namespace App\Models\Ead;

use App\Models\Colaborador;
use Illuminate\Database\Eloquent\Model;

class Matricula extends Model
{
    protected $table = 'ead_matriculas';

    protected $fillable = [
        'curso_id',
        'colaborador_id',
        'status',
        'progresso_pct',
        'nota_final',
        'iniciado_em',
        'concluido_em',
    ];

    protected $casts = [
        'curso_id'       => 'integer',
        'colaborador_id' => 'integer',
        'progresso_pct'  => 'integer',
        'nota_final'     => 'integer',
        'iniciado_em'    => 'datetime',
        'concluido_em'   => 'datetime',
    ];

    public function curso()       { return $this->belongsTo(Curso::class, 'curso_id'); }
    public function colaborador() { return $this->belongsTo(Colaborador::class, 'colaborador_id'); }
    public function progresso()   { return $this->hasMany(AulaProgresso::class, 'matricula_id'); }
}
