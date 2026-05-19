<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comunicado extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'empresa_id',
        'setor_id',
        'criado_por',
        'titulo',
        'corpo',
        'tipo',       // info | alerta | urgente
        'publicado',
        'expira_em',
    ];

    protected $casts = [
        'empresa_id' => 'integer',
        'setor_id'   => 'integer',
        'criado_por' => 'integer',
        'publicado'  => 'boolean',
        'expira_em'  => 'datetime',
    ];

    public function empresa()   { return $this->belongsTo(Empresa::class); }
    public function criador()   { return $this->belongsTo(User::class, 'criado_por'); }
    public function leituras()  { return $this->belongsToMany(Colaborador::class, 'comunicado_leituras')->withPivot('lido_em'); }
}
