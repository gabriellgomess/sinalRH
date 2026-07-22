<?php

namespace App\Models\Ead;

use Illuminate\Database\Eloquent\Model;

class Teste extends Model
{
    protected $table = 'ead_testes';

    protected $fillable = [
        'curso_id',
        'modulo_id',
        'titulo',
        'descricao',
        'nota_minima',
        'tentativas_max',
        'embaralhar',
        'obrigatorio_aprovacao',
    ];

    protected $casts = [
        'curso_id'              => 'integer',
        'modulo_id'             => 'integer',
        'nota_minima'           => 'integer',
        'tentativas_max'        => 'integer',
        'embaralhar'            => 'boolean',
        'obrigatorio_aprovacao' => 'boolean',
    ];

    public function curso()     { return $this->belongsTo(Curso::class, 'curso_id'); }
    public function modulo()    { return $this->belongsTo(Modulo::class, 'modulo_id'); }
    public function perguntas() { return $this->hasMany(TestePergunta::class, 'teste_id')->orderBy('ordem'); }
    public function tentativas(){ return $this->hasMany(TesteTentativa::class, 'teste_id'); }
}
