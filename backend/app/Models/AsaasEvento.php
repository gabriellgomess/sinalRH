<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AsaasEvento extends Model
{
    protected $table = 'asaas_eventos';

    protected $fillable = [
        'asaas_event_id',
        'event_type',
        'empresa_produto_id',
        'payload',
        'resultado',
        'erro',
        'processado_em',
    ];

    protected $casts = [
        'empresa_produto_id' => 'integer',
        'payload'            => 'array',
        'processado_em'      => 'datetime',
    ];

    public function produto() { return $this->belongsTo(EmpresaProduto::class, 'empresa_produto_id'); }
}
