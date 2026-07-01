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
        'mapa_riscos'     => ['titulo' => 'Mapa de Riscos',              'tipo' => 'recorrente'],
        'pesquisas'       => ['titulo' => 'Pesquisas e Clima',           'tipo' => 'recorrente'],
        'checkins'        => ['titulo' => 'Check-ins Semanais',          'tipo' => 'recorrente'],
        'diagnostico_nr1' => ['titulo' => 'Diagnóstico Psicossocial NR-1', 'tipo' => 'unica'],
        'plano_acao_nr1'  => ['titulo' => 'Plano de Ação Continuado NR-1', 'tipo' => 'recorrente'],
        'canal_escuta'    => ['titulo' => 'Canal de Escuta Profissional',  'tipo' => 'recorrente'],
        'feedback'        => ['titulo' => 'Feedback 360',                'tipo' => 'recorrente'],
        'pdi'             => ['titulo' => 'Plano de Desenvolvimento (PDI)', 'tipo' => 'recorrente'],
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
        'valor_unico',
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
        'valor_unico'              => 'decimal:2',
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
    public function valorProjetadoAnual(int $colaboradoresAtivos = 0): ?float
    {
        $anual = 0.0;

        if (in_array($this->tipo, ['unica', 'ambas'], true) && $this->valor_unico !== null) {
            $anual += (float) $this->valor_unico;
        }

        if (in_array($this->tipo, ['recorrente', 'ambas'], true) && $this->valor_mensal !== null) {
            $anual += (float) $this->valor_mensal * 12;
        }

        return $anual > 0 ? $anual : null;
    }
}
