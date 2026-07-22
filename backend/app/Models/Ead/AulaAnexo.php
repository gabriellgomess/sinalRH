<?php

namespace App\Models\Ead;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AulaAnexo extends Model
{
    protected $table = 'ead_aula_anexos';

    protected $fillable = [
        'aula_id',
        'nome_original',
        'caminho_storage',
        'mime',
        'tamanho_bytes',
        'categoria',
        'enviado_por',
    ];

    protected $casts = [
        'aula_id'       => 'integer',
        'tamanho_bytes' => 'integer',
        'enviado_por'   => 'integer',
    ];

    public function aula()       { return $this->belongsTo(Aula::class, 'aula_id'); }
    public function enviadoPor() { return $this->belongsTo(User::class, 'enviado_por'); }
}
