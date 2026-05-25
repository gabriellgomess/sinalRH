<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmpresaProduto extends Model
{
    protected $table = 'empresa_produtos';

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->numero_contrato)) {
                $year = now()->year;
                if ($model->data_inicio) {
                    try {
                        $year = \Carbon\Carbon::parse($model->data_inicio)->year;
                    } catch (\Throwable $e) {
                        // Ignore
                    }
                }
                $prefix = "SLC-{$year}-";
                $lastContract = static::where('numero_contrato', 'like', "{$prefix}%")
                    ->orderBy('numero_contrato', 'desc')
                    ->first();

                $nextNumber = 1;
                if ($lastContract && preg_match('/SLC-\d{4}-(\d+)/', $lastContract->numero_contrato, $matches)) {
                    $nextNumber = ((int) $matches[1]) + 1;
                }

                $model->numero_contrato = sprintf('SLC-%04d-%03d', $year, $nextNumber);
            }
        });
    }

    public const PRODUTOS = [
        'mapa_riscos'     => ['titulo' => 'Mapa de Riscos',              'tipo' => 'recorrente_mensal'],
        'pesquisas'       => ['titulo' => 'Pesquisas e Clima',           'tipo' => 'recorrente_mensal'],
        'checkins'        => ['titulo' => 'Check-ins Semanais',          'tipo' => 'recorrente_mensal'],
        'diagnostico_nr1' => ['titulo' => 'Diagnóstico Psicossocial NR-1', 'tipo' => 'pontual'],
        'plano_acao_nr1'  => ['titulo' => 'Plano de Ação Continuado NR-1', 'tipo' => 'recorrente_mensal'],
        'canal_escuta'    => ['titulo' => 'Canal de Escuta Profissional',  'tipo' => 'recorrente_mensal'],
        'feedback'        => ['titulo' => 'Feedback 360',                'tipo' => 'recorrente_mensal'],
        'pdi'             => ['titulo' => 'Plano de Desenvolvimento (PDI)', 'tipo' => 'recorrente_mensal'],
    ];

    public const CICLOS = [
        'WEEKLY'        => 'Semanal',
        'BIWEEKLY'      => 'Quinzenal',
        'MONTHLY'       => 'Mensal',
        'QUARTERLY'     => 'Trimestral',
        'SEMIANNUALLY'  => 'Semestral',
        'YEARLY'        => 'Anual',
    ];

    protected $fillable = [
        'empresa_id',
        'produto',
        'tipo',
        'valor_unitario',
        'valor_mensal',
        'ciclo',
        'quantidade_aplicacoes',
        'limite_colaboradores',
        'data_inicio',
        'data_fim',
        'proxima_cobranca_em',
        'status',
        'numero_contrato',
        'data_assinatura_contrato',
        'observacoes',
        'contratado_por',
        'asaas_subscription_id',
        'asaas_payment_id',
        'asaas_invoice_url',
        'asaas_metadata',
        'asaas_ultima_sincronizacao_em',
    ];

    protected $casts = [
        'empresa_id'               => 'integer',
        'valor_unitario'           => 'decimal:2',
        'valor_mensal'             => 'decimal:2',
        'quantidade_aplicacoes'    => 'integer',
        'limite_colaboradores'     => 'integer',
        'data_inicio'              => 'date',
        'data_fim'                 => 'date',
        'proxima_cobranca_em'      => 'date',
        'data_assinatura_contrato' => 'date',
        'contratado_por'           => 'integer',
        'asaas_metadata'           => 'array',
        'asaas_ultima_sincronizacao_em' => 'datetime',
    ];

    public function empresa()       { return $this->belongsTo(Empresa::class); }
    public function contratadoPor() { return $this->belongsTo(User::class, 'contratado_por'); }

    public function getTituloAttribute(): string
    {
        return self::PRODUTOS[$this->produto]['titulo'] ?? $this->produto;
    }

    // Calculo de valor projetado:
    // - diagnostico = valor_unitario × (limite_colaboradores ou colaboradores ativos) × quantidade_aplicacoes
    // - recorrente_mensal = valor_mensal
    public function valorProjetadoAnual(int $colaboradoresAtivos): ?float
    {
        if ($this->tipo === 'pontual' && $this->valor_unitario !== null) {
            $base = ($this->limite_colaboradores && $this->limite_colaboradores > 0)
                ? $this->limite_colaboradores
                : $colaboradoresAtivos;
            return (float) $this->valor_unitario * $base * ($this->quantidade_aplicacoes ?? 1);
        }
        if ($this->tipo === 'recorrente_mensal' && $this->valor_mensal !== null) {
            return (float) $this->valor_mensal * 12;
        }
        return null;
    }
}
