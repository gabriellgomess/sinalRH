<?php

namespace App\Models\Ead;

use App\Models\Colaborador;
use Illuminate\Database\Eloquent\Model;

class TesteTentativa extends Model
{
    protected $table = 'ead_teste_tentativas';

    protected $fillable = [
        'teste_id',
        'colaborador_id',
        'numero_tentativa',
        'respostas',
        'nota',
        'aprovado',
        'finalizada_em',
    ];

    protected $casts = [
        'teste_id'         => 'integer',
        'colaborador_id'   => 'integer',
        'numero_tentativa' => 'integer',
        'respostas'        => 'array',
        'nota'             => 'integer',
        'aprovado'         => 'boolean',
        'finalizada_em'    => 'datetime',
    ];

    public function teste()       { return $this->belongsTo(Teste::class, 'teste_id'); }
    public function colaborador() { return $this->belongsTo(Colaborador::class, 'colaborador_id'); }
}
