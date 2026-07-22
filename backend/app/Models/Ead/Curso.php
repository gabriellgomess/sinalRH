<?php

namespace App\Models\Ead;

use App\Models\Empresa;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Curso extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ead_cursos';

    protected $fillable = [
        'criado_por',
        'titulo',
        'descricao',
        'capa_storage',
        'status',        // rascunho | publicado | arquivado
        'obrigatorio',
        'carga_horaria_min',
        'prazo_dias',
        'publicado_em',
    ];

    protected $casts = [
        'obrigatorio'       => 'boolean',
        'carga_horaria_min' => 'integer',
        'prazo_dias'        => 'integer',
        'publicado_em'      => 'datetime',
    ];

    // ── Relacionamentos ───────────────────────────────────────────────────
    public function criador()
    {
        return $this->belongsTo(User::class, 'criado_por');
    }

    public function modulos()
    {
        return $this->hasMany(Modulo::class, 'curso_id')->orderBy('ordem');
    }

    public function testes()
    {
        return $this->hasMany(Teste::class, 'curso_id');
    }

    public function liberacoes()
    {
        return $this->hasMany(CursoEmpresa::class, 'curso_id');
    }

    public function empresas()
    {
        return $this->belongsToMany(Empresa::class, 'ead_curso_empresa', 'curso_id', 'empresa_id')
            ->withPivot(['ativo', 'setor_id', 'prazo', 'liberado_em', 'liberado_por'])
            ->withTimestamps();
    }

    public function matriculas()
    {
        return $this->hasMany(Matricula::class, 'curso_id');
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    public function aulas()
    {
        return Aula::whereIn('modulo_id', $this->modulos()->pluck('id'));
    }

    public function totalAulas(): int
    {
        return Aula::whereIn('modulo_id', $this->modulos()->pluck('id'))->count();
    }
}
