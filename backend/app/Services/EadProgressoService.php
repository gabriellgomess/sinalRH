<?php

namespace App\Services;

use App\Models\Colaborador;
use App\Models\Ead\Aula;
use App\Models\Ead\AulaProgresso;
use App\Models\Ead\Curso;
use App\Models\Ead\Matricula;
use App\Models\Ead\TesteTentativa;

/**
 * Regras de progresso, conclusao e nota final dos cursos EAD.
 * Somente colaboradores geram matricula/progresso — o modo visualizacao do
 * admin nunca chama este servico.
 */
class EadProgressoService
{
    public function matricular(Colaborador $colaborador, Curso $curso): Matricula
    {
        return Matricula::firstOrCreate(
            ['curso_id' => $curso->id, 'colaborador_id' => $colaborador->id],
            ['status' => 'nao_iniciado', 'progresso_pct' => 0]
        );
    }

    public function concluirAula(Matricula $matricula, Aula $aula, ?int $segundos = null): void
    {
        AulaProgresso::updateOrCreate(
            ['matricula_id' => $matricula->id, 'aula_id' => $aula->id],
            ['concluida_em' => now(), 'segundos_assistidos' => $segundos]
        );

        if (!$matricula->iniciado_em) {
            $matricula->iniciado_em = now();
        }

        $this->recalcular($matricula);
    }

    /**
     * Recalcula progresso, nota final e status de conclusao.
     */
    public function recalcular(Matricula $matricula): Matricula
    {
        $curso = $matricula->curso;
        $idsAulas = Aula::whereIn('modulo_id', $curso->modulos()->pluck('id'))->pluck('id');
        $totalAulas = $idsAulas->count();

        $concluidas = AulaProgresso::where('matricula_id', $matricula->id)
            ->whereIn('aula_id', $idsAulas)
            ->whereNotNull('concluida_em')
            ->count();

        $pct = $totalAulas > 0 ? (int) round(($concluidas / $totalAulas) * 100) : 0;

        // Testes com aprovacao obrigatoria.
        $testesObrig = $curso->testes()->where('obrigatorio_aprovacao', true)->get();
        $todosAprovados = true;
        foreach ($testesObrig as $teste) {
            $aprovado = TesteTentativa::where('teste_id', $teste->id)
                ->where('colaborador_id', $matricula->colaborador_id)
                ->where('aprovado', true)
                ->exists();
            if (!$aprovado) {
                $todosAprovados = false;
                break;
            }
        }

        $concluido = $totalAulas > 0 && $concluidas >= $totalAulas && $todosAprovados;

        $matricula->progresso_pct = $pct;
        $matricula->nota_final    = $this->notaFinal($matricula);
        $matricula->status        = $concluido ? 'concluido' : ($pct > 0 || $matricula->iniciado_em ? 'em_andamento' : 'nao_iniciado');

        if ($concluido && !$matricula->concluido_em) {
            $matricula->concluido_em = now();
        }
        if (!$concluido) {
            $matricula->concluido_em = null;
        }

        $matricula->save();

        return $matricula;
    }

    /**
     * Nota final = media ponderada (por peso do teste = nº de perguntas)
     * das melhores tentativas de cada teste do curso. Null se nao houver.
     */
    public function notaFinal(Matricula $matricula): ?int
    {
        $testes = $matricula->curso->testes()->withCount('perguntas')->get();
        if ($testes->isEmpty()) {
            return null;
        }

        $somaNotas = 0;
        $somaPesos = 0;
        $temTentativa = false;

        foreach ($testes as $teste) {
            $melhor = TesteTentativa::where('teste_id', $teste->id)
                ->where('colaborador_id', $matricula->colaborador_id)
                ->max('nota');

            if ($melhor === null) {
                continue;
            }
            $temTentativa = true;
            $peso = max(1, (int) $teste->perguntas_count);
            $somaNotas += $melhor * $peso;
            $somaPesos += $peso;
        }

        if (!$temTentativa || $somaPesos === 0) {
            return null;
        }

        return (int) round($somaNotas / $somaPesos);
    }
}
