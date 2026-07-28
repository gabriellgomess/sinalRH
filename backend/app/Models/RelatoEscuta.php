<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RelatoEscuta extends Model
{
    use HasFactory;

    protected $table = 'relatos_escuta';

    protected $fillable = [
        'empresa_id',
        'colaborador_id', // null se anônimo
        'setor_id',       // setor do colaborador ou informado
        'modo',           // anonimo | identificado
        'categoria',      // sobrecarga | assedio | lideranca | comunicacao | sugestao | outro
        'tipo_envolvido',       // colaborador_setor|lideranca|rh|diretoria|presidencia|nao_sabe|nao_informar
        'setor_denunciado_id',
        'usuario_denunciado_id',
        'cargo_nivel_denunciado',
        'grupo_destino',        // rh|diretoria|presidencia|comite_externo
        'nivel_sigilo',         // padrao|alto|maximo
        'tag',
        'texto',
        'status',         // pendente | em_analise | resolvido | arquivado
        'prioridade',     // baixa | media | alta | critica
        'nota_interna',   // notas da equipe de RH (não visível ao colaborador)
        'atendido_por',   // User ID
        'atendido_em',
        'origem',           // interno | publico
        'protocolo',        // credencial de acompanhamento (ESC-XXXXX-XXXXX)
        'email_notificacao',// opcional, apenas para aviso de resposta
        'comite_token',     // credencial do comite externo (link por e-mail)
        'comite_ultimo_acesso_em',
    ];

    protected $casts = [
        'empresa_id'     => 'integer',
        'colaborador_id' => 'integer',
        'setor_id'       => 'integer',
        'atendido_por'   => 'integer',
        'atendido_em'    => 'datetime',
        'setor_denunciado_id'   => 'integer',
        'usuario_denunciado_id' => 'integer',
        // Cifrado em repouso: o e-mail opcional do denunciante nao fica legivel
        // em dumps/backups do banco.
        'email_notificacao'     => 'encrypted',
        'comite_ultimo_acesso_em' => 'datetime',
    ];

    protected $hidden = ['colaborador_id', 'nota_interna', 'email_notificacao', 'comite_token']; // proteger identidade por padrão

    // ── Relacionamentos ───────────────────────────────────────────────────
    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class);
    }

    public function setor()
    {
        return $this->belongsTo(Setor::class);
    }

    public function atendente()
    {
        return $this->belongsTo(User::class, 'atendido_por');
    }

    public function setorDenunciado()   { return $this->belongsTo(Setor::class, 'setor_denunciado_id'); }
    public function usuarioDenunciado() { return $this->belongsTo(User::class, 'usuario_denunciado_id'); }
    public function notas()   { return $this->hasMany(EscutaNota::class, 'relato_id')->orderBy('created_at'); }
    public function acessos() { return $this->hasMany(EscutaAcesso::class, 'relato_id')->orderByDesc('created_at'); }
    public function mensagens() { return $this->hasMany(EscutaMensagem::class, 'relato_id')->orderBy('created_at'); }

    // ── Protocolo ────────────────────────────────────────────────────────
    /** Prazo (em dias uteis) prometido na pagina publica para o 1o retorno. */
    public const SLA_DIAS = 7;

    /**
     * Gera protocolo unico de alta entropia (~50 bits).
     * Alfabeto sem caracteres ambiguos (0/O, 1/I/L).
     */
    public static function gerarProtocolo(): string
    {
        $alfabeto = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
        do {
            $chars = '';
            for ($i = 0; $i < 10; $i++) {
                $chars .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
            }
            $protocolo = 'ESC-' . substr($chars, 0, 5) . '-' . substr($chars, 5);
        } while (self::where('protocolo', $protocolo)->exists());

        return $protocolo;
    }

    /** Token de acesso do comite externo (credencial distinta do protocolo). */
    public static function gerarComiteToken(): string
    {
        do {
            $token = bin2hex(random_bytes(24)); // 48 chars, 192 bits
        } while (self::where('comite_token', $token)->exists());

        return $token;
    }

    // ── Scopes ───────────────────────────────────────────────────────────
    public function scopePendentes($query)
    {
        return $query->where('status', 'pendente');
    }

    public function scopeCriticos($query)
    {
        return $query->where('prioridade', 'critica');
    }
}
