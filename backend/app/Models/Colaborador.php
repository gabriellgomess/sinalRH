<?php

namespace App\Models;

use Illuminate\Auth\Authenticatable as AuthenticatableTrait;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class Colaborador extends Model implements AuthenticatableContract
{
    use AuthenticatableTrait, HasApiTokens, HasFactory, SoftDeletes;

    protected $table = 'colaboradores';

    protected $fillable = [
        'empresa_id',
        'setor_id',
        'nome',
        'email',
        'cpf',
        'codigo_acesso', // código alternativo de login
        'password',
        'convite_token',
        'convite_expira_em',
        'convite_aceito_em',
        'cargo',
        'data_admissao',
        'status',        // ativo | afastado | desligado
        'token_fcm',     // para push notifications
    ];

    protected $hidden = ['password', 'cpf', 'token_fcm', 'convite_token'];

    protected $casts = [
        'data_admissao' => 'date',
        'convite_expira_em' => 'datetime',
        'convite_aceito_em' => 'datetime',
        'empresa_id'    => 'integer',
        'setor_id'      => 'integer',
        'password'      => 'hashed',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (!$model->codigo_acesso) {
                $model->codigo_acesso = strtoupper(substr(md5(uniqid()), 0, 8));
            }
        });
    }

    // ── Relacionamentos ───────────────────────────────────────────────────
    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function setor()
    {
        return $this->belongsTo(Setor::class);
    }

    public function respostas()
    {
        return $this->hasMany(Resposta::class);
    }

    public function checkins()
    {
        return $this->hasMany(CheckIn::class);
    }

    public function ultimoCheckin()
    {
        return $this->hasOne(CheckIn::class)->latestOfMany();
    }

    public function relatos()
    {
        return $this->hasMany(RelatoEscuta::class);
    }

    // ── Accessors ─────────────────────────────────────────────────────────
    public function getIniciaisAttribute(): string
    {
        return collect(explode(' ', $this->nome))
            ->filter()
            ->take(2)
            ->map(fn ($n) => mb_strtoupper(mb_substr($n, 0, 1)))
            ->implode('');
    }

    public function getStreakCheckinsAttribute(): int
    {
        return $this->checkins()
            ->where('created_at', '>=', now()->subWeeks(12))
            ->count();
    }
}
