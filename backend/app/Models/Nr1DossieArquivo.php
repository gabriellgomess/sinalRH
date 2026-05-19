<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nr1DossieArquivo extends Model
{
    protected $table = 'nr1_dossie_arquivos';

    protected $fillable = [
        'avaliacao_id',
        'pasta_codigo',
        'subpasta',
        'nome_original',
        'caminho_storage',
        'tamanho_bytes',
        'mime_type',
        'descricao',
        'enviado_por',
    ];

    protected $casts = [
        'avaliacao_id'  => 'integer',
        'tamanho_bytes' => 'integer',
        'enviado_por'   => 'integer',
    ];

    public function avaliacao()  { return $this->belongsTo(Nr1Avaliacao::class, 'avaliacao_id'); }
    public function enviadoPor() { return $this->belongsTo(User::class, 'enviado_por'); }
}
