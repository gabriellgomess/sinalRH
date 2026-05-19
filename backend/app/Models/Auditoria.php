<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Auditoria extends Model
{
    use HasFactory;

    protected $table = 'auditorias';

    protected $fillable = [
        'empresa_id',
        'user_id',
        'acao',
        'entidade_tipo',
        'entidade_id',
        'descricao',
        'antes',
        'depois',
        'ip',
        'user_agent',
    ];

    protected $casts = [
        'empresa_id' => 'integer',
        'user_id' => 'integer',
        'entidade_id' => 'integer',
        'antes' => 'array',
        'depois' => 'array',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
