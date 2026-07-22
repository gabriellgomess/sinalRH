<?php

namespace App\Models\Ead;

use App\Models\Empresa;
use App\Models\Setor;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class CursoEmpresa extends Model
{
    protected $table = 'ead_curso_empresa';

    protected $fillable = [
        'curso_id',
        'empresa_id',
        'ativo',
        'setor_id',
        'prazo',
        'liberado_em',
        'liberado_por',
    ];

    protected $casts = [
        'curso_id'     => 'integer',
        'empresa_id'   => 'integer',
        'setor_id'     => 'integer',
        'ativo'        => 'boolean',
        'prazo'        => 'date',
        'liberado_em'  => 'datetime',
    ];

    public function curso()    { return $this->belongsTo(Curso::class, 'curso_id'); }
    public function empresa()  { return $this->belongsTo(Empresa::class, 'empresa_id'); }
    public function setor()    { return $this->belongsTo(Setor::class, 'setor_id'); }
    public function liberadoPor() { return $this->belongsTo(User::class, 'liberado_por'); }
}
