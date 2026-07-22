<?php

namespace App\Models\Ead;

use Illuminate\Database\Eloquent\Model;

class Aula extends Model
{
    protected $table = 'ead_aulas';

    protected $fillable = [
        'modulo_id',
        'titulo',
        'ordem',
        'tipo',            // video_upload | video_youtube | texto | documento
        'conteudo',
        'video_storage',
        'video_youtube_id',
        'duracao_seg',
    ];

    protected $casts = [
        'modulo_id'   => 'integer',
        'ordem'       => 'integer',
        'duracao_seg' => 'integer',
    ];

    public function modulo()
    {
        return $this->belongsTo(Modulo::class, 'modulo_id');
    }

    public function anexos()
    {
        return $this->hasMany(AulaAnexo::class, 'aula_id');
    }

    public function curso()
    {
        return $this->hasOneThrough(
            Curso::class,
            Modulo::class,
            'id',        // Modulo.id
            'id',        // Curso.id
            'modulo_id', // Aula.modulo_id
            'curso_id'   // Modulo.curso_id
        );
    }
}
