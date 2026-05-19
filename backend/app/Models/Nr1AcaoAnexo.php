<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nr1AcaoAnexo extends Model
{
    protected $table = 'nr1_acao_anexos';

    protected $fillable = [
        'acao_id',
        'nome_original',
        'caminho_storage',
        'tamanho_bytes',
        'mime_type',
        'descricao',
        'enviado_por',
    ];

    protected $casts = [
        'acao_id'       => 'integer',
        'tamanho_bytes' => 'integer',
        'enviado_por'   => 'integer',
    ];

    public function acao()      { return $this->belongsTo(Nr1PlanoAcao::class, 'acao_id'); }
    public function enviadoPor(){ return $this->belongsTo(User::class, 'enviado_por'); }
}
