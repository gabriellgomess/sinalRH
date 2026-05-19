<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Nr1Avaliacao extends Model
{
    use SoftDeletes;

    protected $table = 'nr1_avaliacoes';

    protected $fillable = [
        'empresa_id',
        'titulo',
        'codigo',
        'aplicada_em',
        'status',
        'observacoes',
        'criado_por',
        'versao',
        'versao_origem_id',
        'proxima_avaliacao_em',
        'aprovado_por',
        'aprovado_cargo',
        'aprovado_em',
    ];

    protected $casts = [
        'aplicada_em'          => 'date',
        'proxima_avaliacao_em' => 'date',
        'aprovado_em'          => 'date',
        'empresa_id'           => 'integer',
        'criado_por'           => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $avaliacao) {
            if (empty($avaliacao->codigo)) {
                $avaliacao->codigo = strtoupper(Str::random(10));
            }
        });
    }

    public function empresa()      { return $this->belongsTo(Empresa::class); }
    public function criador()      { return $this->belongsTo(User::class, 'criado_por'); }
    public function respondentes() { return $this->hasMany(Nr1Respondente::class, 'avaliacao_id'); }
    public function respostas()    { return $this->hasMany(Nr1Resposta::class, 'avaliacao_id'); }
    public function planoAcoes()   { return $this->hasMany(Nr1PlanoAcao::class, 'avaliacao_id')->orderBy('prioridade')->orderBy('created_at'); }
    public function versaoOrigem() { return $this->belongsTo(self::class, 'versao_origem_id'); }
    public function novasVersoes() { return $this->hasMany(self::class, 'versao_origem_id'); }
}
