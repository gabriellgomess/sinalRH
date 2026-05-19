<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Relatorio extends Model
{
    use HasFactory;

    protected $fillable = [
        'empresa_id',
        'criado_por',
        'periodo',              // 2026-Q2
        'tipo',                 // executivo | setorial | risco | comparativo
        'status',               // gerando | pronto | erro
        'resumo_executivo',
        'pontos_positivos',     // JSON array
        'pontos_atencao',       // JSON array
        'recomendacoes',        // JSON array
        'plano_acao',           // JSON array
        'gerado_por_ia',
        'revisado_por',         // User ID
        'revisado_em',
        'pdf_path',
        'metadados',            // JSON: colaboradores, setores, etc.
    ];

    protected $casts = [
        'pontos_positivos' => 'array',
        'pontos_atencao'   => 'array',
        'recomendacoes'    => 'array',
        'plano_acao'       => 'array',
        'metadados'        => 'array',
        'gerado_por_ia'    => 'boolean',
        'revisado_por'     => 'integer',
        'empresa_id'       => 'integer',
        'criado_por'       => 'integer',
        'revisado_em'      => 'datetime',
    ];

    public function empresa()   { return $this->belongsTo(Empresa::class); }
    public function criador()   { return $this->belongsTo(User::class, 'criado_por'); }
    public function revisor()   { return $this->belongsTo(User::class, 'revisado_por'); }
}
