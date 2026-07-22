<?php

namespace App\Models\Ead;

use Illuminate\Database\Eloquent\Model;

class Modulo extends Model
{
    protected $table = 'ead_modulos';

    protected $fillable = [
        'curso_id',
        'titulo',
        'descricao',
        'ordem',
    ];

    protected $casts = [
        'curso_id' => 'integer',
        'ordem'    => 'integer',
    ];

    public function curso()
    {
        return $this->belongsTo(Curso::class, 'curso_id');
    }

    public function aulas()
    {
        return $this->hasMany(Aula::class, 'modulo_id')->orderBy('ordem');
    }
}
