<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EscutaAcesso extends Model
{
    protected $table = 'escuta_acessos';

    public $timestamps = false;

    protected $fillable = ['relato_id', 'user_id', 'acao', 'detalhe', 'ip_hash', 'created_at'];

    protected $casts = [
        'relato_id'  => 'integer',
        'user_id'    => 'integer',
        'created_at' => 'datetime',
    ];

    public function relato() { return $this->belongsTo(RelatoEscuta::class, 'relato_id'); }
    public function user()   { return $this->belongsTo(User::class, 'user_id'); }
}
