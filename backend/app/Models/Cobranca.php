<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cobranca extends Model
{
    protected $table = 'cobrancas';

    public const CICLOS = [
        'WEEKLY'       => 'Semanal',
        'BIWEEKLY'     => 'Quinzenal',
        'MONTHLY'      => 'Mensal',
        'QUARTERLY'    => 'Trimestral',
        'SEMIANNUALLY' => 'Semestral',
        'YEARLY'       => 'Anual',
    ];

    public const BILLING_TYPES = ['BOLETO', 'PIX', 'CREDIT_CARD', 'UNDEFINED'];

    protected $fillable = [
        'empresa_id',
        'tipo',
        'descricao',
        'valor',
        'ciclo',
        'billing_type',
        'vencimento',
        'status',
        'asaas_payment_id',
        'asaas_subscription_id',
        'asaas_invoice_url',
        'asaas_metadata',
        'observacoes',
        'criado_por',
        'asaas_ultima_sincronizacao_em',
    ];

    protected $casts = [
        'empresa_id'                    => 'integer',
        'valor'                         => 'decimal:2',
        'vencimento'                    => 'date',
        'asaas_metadata'                => 'array',
        'criado_por'                    => 'integer',
        'asaas_ultima_sincronizacao_em' => 'datetime',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function criadoPor()
    {
        return $this->belongsTo(User::class, 'criado_por');
    }
}
