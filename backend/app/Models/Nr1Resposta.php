<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nr1Resposta extends Model
{
    protected $table = 'nr1_respostas';

    protected $fillable = [
        'respondente_id',
        'avaliacao_id',
        'secao',
        'item',
        'valor',
    ];

    protected $casts = [
        'secao' => 'integer',
        'item'  => 'integer',
    ];

    public function respondente() { return $this->belongsTo(Nr1Respondente::class, 'respondente_id'); }
    public function avaliacao()   { return $this->belongsTo(Nr1Avaliacao::class, 'avaliacao_id'); }
}
