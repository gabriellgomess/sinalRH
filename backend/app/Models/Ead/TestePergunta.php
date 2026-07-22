<?php

namespace App\Models\Ead;

use Illuminate\Database\Eloquent\Model;

class TestePergunta extends Model
{
    protected $table = 'ead_teste_perguntas';

    protected $fillable = [
        'teste_id',
        'enunciado',
        'tipo',
        'opcoes',
        'resposta_correta',
        'peso',
        'ordem',
    ];

    protected $casts = [
        'teste_id'         => 'integer',
        'opcoes'           => 'array',
        'resposta_correta' => 'array',
        'peso'             => 'integer',
        'ordem'            => 'integer',
    ];

    public function teste() { return $this->belongsTo(Teste::class, 'teste_id'); }
}
