<?php

namespace App\Services;

use App\Mail\EscutaComiteMail;
use App\Mail\EscutaNovoRelatoMail;
use App\Models\Empresa;
use App\Models\RelatoEscuta;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Notificacoes do Canal de Escuta. Compartilhado entre o relato interno
 * (app logado) e o relato publico (pagina sem login).
 *
 * Falhas de e-mail NUNCA bloqueiam o registro da denuncia.
 */
class EscutaNotificacaoService
{
    public function novoRelato(RelatoEscuta $relato, string $identificacao = 'Relato anonimo'): void
    {
        try {
            $empresa = Empresa::find($relato->empresa_id);
            if (!$empresa) {
                return;
            }

            if ($relato->grupo_destino === 'comite_externo') {
                if ($empresa->escuta_comite_email) {
                    // Credencial propria do comite (nunca o protocolo do denunciante)
                    if (!$relato->comite_token) {
                        $relato->forceFill(['comite_token' => RelatoEscuta::gerarComiteToken()])->save();
                    }

                    Mail::to($empresa->escuta_comite_email)->queue(new EscutaComiteMail([
                        'empresa'       => $empresa->nome_fantasia,
                        'ref'           => $relato->protocolo ?: $relato->id,
                        'categoria'     => $relato->categoria,
                        'prioridade'    => $relato->prioridade,
                        'texto'         => $relato->texto,
                        'identificacao' => $identificacao,
                        'url_tratamento' => rtrim(config('app.frontend_url'), '/') . '/escuta/comite/' . $relato->comite_token,
                    ]));
                }
                return;
            }

            // Grupos internos: avisa os responsaveis (sem conteudo/identidade),
            // exceto quem for o proprio denunciado.
            $labels = ['rh' => 'RH', 'diretoria' => 'Diretoria', 'presidencia' => 'Presidencia'];
            $responsaveis = User::where('empresa_id', $empresa->id)
                ->where('grupo_escuta', $relato->grupo_destino)
                ->when($relato->usuario_denunciado_id, fn ($q) => $q->where('id', '!=', $relato->usuario_denunciado_id))
                ->pluck('email')
                ->filter();

            foreach ($responsaveis as $email) {
                Mail::to($email)->queue(new EscutaNovoRelatoMail(
                    $empresa->nome_fantasia,
                    $labels[$relato->grupo_destino] ?? $relato->grupo_destino,
                    $relato->prioridade,
                ));
            }
        } catch (\Throwable $e) {
            Log::warning('Falha ao notificar relato de escuta', ['relato_id' => $relato->id, 'erro' => $e->getMessage()]);
        }
    }

    /**
     * Heuristica de prioridade pelo conteudo (compartilhada interno/publico).
     */
    public function prioridade(string $categoria, string $texto): string
    {
        $textoLower = mb_strtolower($texto);

        foreach (['assédio', 'assedio', 'violência', 'violencia', 'ameaça', 'ameaca'] as $palavra) {
            if (str_contains($textoLower, $palavra)) {
                return 'critica';
            }
        }

        foreach (['discriminação', 'discriminacao', 'urgente'] as $palavra) {
            if (str_contains($textoLower, $palavra)) {
                return 'alta';
            }
        }

        if (str_contains($categoria, 'assedio') || str_contains($categoria, 'discriminacao')) {
            return 'alta';
        }

        return 'media';
    }
}
