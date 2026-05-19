<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmpresaProduto extends Model
{
    protected $table = 'empresa_produtos';

    public const PRODUTOS = [
        'diagnostico_nr1' => ['titulo' => 'Diagnóstico Psicossocial NR-1', 'tipo' => 'pontual'],
        'plano_acao_nr1'  => ['titulo' => 'Plano de Ação Continuado NR-1', 'tipo' => 'recorrente_mensal'],
        'canal_escuta'    => ['titulo' => 'Canal de Escuta Profissional',  'tipo' => 'recorrente_mensal'],
    ];

    protected $fillable = [
        'empresa_id',
        'produto',
        'tipo',
        'valor_unitario',
        'valor_mensal',
        'quantidade_aplicacoes',
        'data_inicio',
        'data_fim',
        'proxima_cobranca_em',
        'status',
        'numero_contrato',
        'data_assinatura_contrato',
        'observacoes',
        'contratado_por',
    ];

    protected $casts = [
        'empresa_id'               => 'integer',
        'valor_unitario'           => 'decimal:2',
        'valor_mensal'             => 'decimal:2',
        'quantidade_aplicacoes'    => 'integer',
        'data_inicio'              => 'date',
        'data_fim'                 => 'date',
        'proxima_cobranca_em'      => 'date',
        'data_assinatura_contrato' => 'date',
        'contratado_por'           => 'integer',
    ];

    public function empresa()       { return $this->belongsTo(Empresa::class); }
    public function contratadoPor() { return $this->belongsTo(User::class, 'contratado_por'); }

    public function getTituloAttribute(): string
    {
        return self::PRODUTOS[$this->produto]['titulo'] ?? $this->produto;
    }

    // Calculo de valor projetado:
    // - diagnostico = valor_unitario × colaboradores ativos × quantidade_aplicacoes
    // - recorrente_mensal = valor_mensal
    public function valorProjetadoAnual(int $colaboradoresAtivos): ?float
    {
        if ($this->tipo === 'pontual' && $this->valor_unitario !== null) {
            return (float) $this->valor_unitario * $colaboradoresAtivos * ($this->quantidade_aplicacoes ?? 1);
        }
        if ($this->tipo === 'recorrente_mensal' && $this->valor_mensal !== null) {
            return (float) $this->valor_mensal * 12;
        }
        return null;
    }
}
