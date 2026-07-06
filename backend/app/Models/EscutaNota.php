<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EscutaNota extends Model
{
    protected $table = 'escuta_notas';

    protected $fillable = ['relato_id', 'autor_id', 'nota'];

    protected $casts = [
        'relato_id' => 'integer',
        'autor_id'  => 'integer',
    ];

    public function relato() { return $this->belongsTo(RelatoEscuta::class, 'relato_id'); }
    public function autor()  { return $this->belongsTo(User::class, 'autor_id'); }
}
