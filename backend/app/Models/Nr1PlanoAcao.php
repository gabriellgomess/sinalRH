<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nr1PlanoAcao extends Model
{
    protected $table = 'nr1_plano_acoes';

    protected $fillable = [
        'avaliacao_id',
        'setor_id',
        'secao',
        'risco_descricao',
        'acao',
        'responsavel',
        'responsavel_cargo',
        'data_inicio',
        'data_prevista',
        'data_conclusao',
        'status',
        'prioridade',
        'observacoes',
    ];

    protected $casts = [
        'avaliacao_id'   => 'integer',
        'setor_id'       => 'integer',
        'secao'          => 'integer',
        'data_inicio'    => 'date',
        'data_prevista'  => 'date',
        'data_conclusao' => 'date',
    ];

    public function avaliacao() { return $this->belongsTo(Nr1Avaliacao::class, 'avaliacao_id'); }
    public function setor()     { return $this->belongsTo(Setor::class); }
    public function anexos()    { return $this->hasMany(Nr1AcaoAnexo::class, 'acao_id')->orderByDesc('created_at'); }
}
