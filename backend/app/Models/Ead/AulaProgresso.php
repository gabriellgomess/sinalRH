<?php

namespace App\Models\Ead;

use Illuminate\Database\Eloquent\Model;

class AulaProgresso extends Model
{
    protected $table = 'ead_aula_progresso';

    protected $fillable = [
        'matricula_id',
        'aula_id',
        'concluida_em',
        'segundos_assistidos',
    ];

    protected $casts = [
        'matricula_id'        => 'integer',
        'aula_id'             => 'integer',
        'concluida_em'        => 'datetime',
        'segundos_assistidos' => 'integer',
    ];

    public function matricula() { return $this->belongsTo(Matricula::class, 'matricula_id'); }
    public function aula()      { return $this->belongsTo(Aula::class, 'aula_id'); }
}
