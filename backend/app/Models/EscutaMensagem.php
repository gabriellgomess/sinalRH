<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EscutaMensagem extends Model
{
    protected $table = 'escuta_mensagens';

    protected $fillable = ['relato_id', 'autor', 'user_id', 'texto', 'lida_em'];

    protected $casts = [
        'relato_id' => 'integer',
        'user_id'   => 'integer',
        'lida_em'   => 'datetime',
    ];

    // user_id nunca sai na API publica
    protected $hidden = ['user_id'];

    public function relato() { return $this->belongsTo(RelatoEscuta::class, 'relato_id'); }
    public function user()   { return $this->belongsTo(User::class, 'user_id'); }
}
