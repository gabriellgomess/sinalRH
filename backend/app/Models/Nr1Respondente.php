<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nr1Respondente extends Model
{
    protected $table = 'nr1_respondentes';

    protected $fillable = [
        'avaliacao_id',
        'setor_id',
        'sexo',
        'faixa_etaria',
    ];

    // Sem $hidden proposital — não há dados pessoais identificáveis neste model (LGPD)

    public function avaliacao() { return $this->belongsTo(Nr1Avaliacao::class, 'avaliacao_id'); }
    public function setor()     { return $this->belongsTo(Setor::class); }
    public function respostas() { return $this->hasMany(Nr1Resposta::class, 'respondente_id'); }
}
