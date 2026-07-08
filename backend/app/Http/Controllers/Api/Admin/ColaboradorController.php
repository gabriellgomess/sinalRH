<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Colaborador;
use App\Models\Setor;
use App\Support\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use League\Csv\Reader;

class ColaboradorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $colaboradores = Colaborador::where('empresa_id', $request->user()->empresa_id)
            ->when($request->setor,  fn ($q) => $q->where('setor_id', $request->setor))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, fn ($q) => $q->where(function ($sub) use ($request) {
                $sub->where('nome', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->with('setor:id,nome,unidade')
            ->orderBy('nome')
            ->paginate($request->get('per_page', 20));

        $colaboradores->getCollection()->each->makeVisible('cpf');

        return response()->json($colaboradores);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome'          => 'required|string|max:255',
            'email'         => 'required|email|unique:colaboradores',
            'cpf'           => 'nullable|string|max:14|unique:colaboradores',
            'cargo'         => 'nullable|string',
            'setor_id'      => 'required|integer|exists:setores,id',
            'data_admissao' => 'nullable|date',
            'senha'         => 'required|string|min:6',
        ]);

        $empresa = $request->user()->empresa;
        if ($empresa) {
            $ativos = Colaborador::where('empresa_id', $empresa->id)->where('status', 'ativo')->count();
            if ($ativos >= $empresa->max_colaboradores) {
                return response()->json([
                    'message' => "Limite de empregados ativos atingido ({$empresa->max_colaboradores})."
                ], 422);
            }
        }

        $colaborador = Colaborador::create([
            ...$validated,
            'empresa_id' => $request->user()->empresa_id,
            'password'   => $validated['senha'],
        ]);

        AuditLogger::log(
            $request,
            'colaborador.criar',
            $colaborador,
            "Criou empregado {$colaborador->nome}.",
            null,
            $colaborador->only(['id', 'nome', 'email', 'cargo', 'setor_id', 'status'])
        );

        return response()->json($colaborador->load('setor'), 201);
    }

    public function show(Colaborador $colaborador): JsonResponse
    {
        $this->garantirMesmaEmpresa($colaborador);
        return response()->json($colaborador->makeVisible('cpf')->load('setor', 'checkins', 'respostas'));
    }

    public function update(Request $request, Colaborador $colaborador): JsonResponse
    {
        $this->garantirMesmaEmpresa($colaborador);
        $validated = $request->validate([
            'nome'          => 'sometimes|string|max:255',
            'email'         => 'sometimes|email|unique:colaboradores,email,' . $colaborador->id,
            'cpf'           => 'nullable|string|max:14|unique:colaboradores,cpf,' . $colaborador->id,
            'cargo'         => 'nullable|string',
            'setor_id'      => 'sometimes|integer|exists:setores,id',
            'data_admissao' => 'nullable|date',
            'status'        => 'sometimes|in:ativo,afastado,desligado',
            'senha'         => 'sometimes|string|min:6',
        ]);

        $antes = $colaborador->only(['nome', 'cargo', 'setor_id', 'status']);

        if (!empty($validated['senha'])) {
            $validated['password'] = $validated['senha'];
        }
        unset($validated['senha']);

        $colaborador->update($validated);

        AuditLogger::log(
            $request,
            'colaborador.atualizar',
            $colaborador,
            "Atualizou empregado {$colaborador->nome}.",
            $antes,
            $colaborador->fresh()->only(['nome', 'cargo', 'setor_id', 'status'])
        );

        return response()->json($colaborador->fresh('setor')->makeVisible('cpf'));
    }

    public function destroy(Request $request, Colaborador $colaborador): JsonResponse
    {
        abort_if((int) $colaborador->empresa_id !== (int) $request->user()->empresa_id, 403);
        $antes = $colaborador->only(['id', 'nome', 'email', 'cargo', 'setor_id', 'status']);

        $colaborador->delete();

        AuditLogger::log(
            $request,
            'colaborador.excluir',
            $colaborador,
            "Removeu empregado {$colaborador->nome}.",
            $antes
        );

        return response()->json(['message' => 'Empregado removido.']);
    }

    public function enviarConvite(Request $request, Colaborador $colaborador): JsonResponse
    {
        abort_if((int) $colaborador->empresa_id !== (int) $request->user()->empresa_id, 403);
        abort_if(!$colaborador->email, 422, 'Empregado sem e-mail cadastrado.');

        $token = Str::random(64);

        $colaborador->forceFill([
            'convite_token' => $token,
            'convite_expira_em' => now()->addDays(7),
            'convite_aceito_em' => null,
        ])->save();

        $baseUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $url = "{$baseUrl}/convite/{$token}";

        Mail::to($colaborador->email)->queue(new \App\Mail\ColaboradorConviteMail(
            $colaborador->fresh(['empresa']),
            $url
        ));

        AuditLogger::log(
            $request,
            'colaborador.convite',
            $colaborador,
            "Enviou convite para {$colaborador->email}.",
            null,
            ['convite_expira_em' => $colaborador->convite_expira_em]
        );

        return response()->json([
            'message' => 'Convite enviado por e-mail.',
            'expira_em' => $colaborador->convite_expira_em,
        ]);
    }

    public function importar(Request $request): JsonResponse
    {
        $request->validate([
            'arquivo' => 'required|file|max:10240',
        ]);

        $empresaId = $request->user()->empresa_id;

        $csv = Reader::createFromPath($request->file('arquivo')->getRealPath(), 'r');
        $csv->setHeaderOffset(0);
        $csv->setDelimiter(';');

        // Cache por unidade + setor para evitar N+1 e impedir mistura entre unidades.
        $setorCache = [];

        $importados = 0;
        $setoresCriados = 0;
        $erros      = [];

        foreach ($csv->getRecords() as $i => $row) {
            $linha = $i + 2;

            $email = trim($row['email'] ?? '');
            $nome  = trim($row['nome']  ?? '');

            if (!$email || !$nome) {
                $erros[] = "Linha {$linha}: nome e e-mail são obrigatórios.";
                continue;
            }

            // Resolve setor pelo nome — cria se não existir
            $nomeSetor = trim($row['setor'] ?? '');
            if (!$nomeSetor) {
                $erros[] = "Linha {$linha} ({$email}): setor e obrigatorio.";
                continue;
            }

            $setorId   = null;

            if ($nomeSetor) {
                $unidade = $this->resolveUnidade($row);
                $cacheKey = mb_strtolower(($unidade ?? 'geral') . '|' . $nomeSetor);

                if (!isset($setorCache[$cacheKey])) {
                    $setor = Setor::firstOrCreate(
                        [
                            'empresa_id' => $empresaId,
                            'nome'       => $nomeSetor,
                            'unidade'    => $unidade,
                        ],
                        [
                            'nivel' => 'setor',
                        ]
                    );

                    if ($setor->wasRecentlyCreated) {
                        $setoresCriados++;
                    }

                    $setorCache[$cacheKey] = $setor->id;
                }
                $setorId = $setorCache[$cacheKey];
            }

            $cpf = trim($row['cpf'] ?? '') ?: null;

            try {
                $colaborador = Colaborador::firstOrNew(['email' => $email]);
                
                $empresa = $request->user()->empresa;
                $maxColaboradores = $empresa?->max_colaboradores ?? 100;
                
                if (!$colaborador->exists || $colaborador->status !== 'ativo') {
                    $ativos = Colaborador::where('empresa_id', $empresaId)->where('status', 'ativo')->count();
                    if ($ativos >= $maxColaboradores) {
                        $erros[] = "Linha {$linha} ({$email}): Limite de empregados ativos atingido ({$maxColaboradores}).";
                        continue;
                    }
                }

                $colaborador->fill([
                    'empresa_id'    => $empresaId,
                    'nome'          => $nome,
                    'cargo'         => trim($row['cargo'] ?? '') ?: null,
                    'setor_id'      => $setorId,
                    'cpf'           => $cpf,
                    'data_admissao' => $this->parseDataAdmissao($row['data_admissao'] ?? null),
                    'status'        => 'ativo',
                ]);

                if (!$colaborador->exists) {
                    // Senha aleatoria forte: a conta so fica acessivel apos o
                    // empregado definir a propria senha via convite (enviarConvite).
                    // Evita credencial previsivel (CPF) ou senha-padrao compartilhada.
                    $colaborador->password = Str::password(40);
                }

                $colaborador->save();
                $importados++;
            } catch (\Throwable $e) {
                $erros[] = "Linha {$linha} ({$email}): " . $e->getMessage();
            }
        }

        AuditLogger::log(
            $request,
            'colaboradores.importar',
            null,
            "Importou {$importados} empregados via CSV.",
            null,
            ['importados' => $importados, 'setores_criados' => $setoresCriados, 'erros' => count($erros)]
        );

        return response()->json([
            'importados'      => $importados,
            'setores_criados' => $setoresCriados,
            'erros'           => $erros,
            'message'         => "{$importados} empregados importados.",
        ]);
    }

    public function exportar(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $colaboradores = Colaborador::where('empresa_id', $request->user()->empresa_id)
            ->with('setor')
            ->get();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="colaboradores.csv"',
        ];

        return response()->stream(function () use ($colaboradores) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($handle, ['Nome', 'Email', 'CPF', 'Cargo', 'Unidade', 'Setor', 'Status', 'Admissao'], ';');
            foreach ($colaboradores as $c) {
                fputcsv($handle, [
                    $c->nome, $c->email, $c->cpf, $c->cargo,
                    $c->setor?->unidade,
                    $c->setor?->nome, $c->status,
                    $c->data_admissao?->format('d/m/Y'),
                ], ';');
            }
            fclose($handle);
        }, 200, $headers);
    }

    public function templateCsv(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="template-colaboradores.csv"',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($handle, ['nome', 'email', 'cpf', 'cargo', 'unidade', 'setor', 'data_admissao'], ';');
            fputcsv($handle, ['Maria Silva', 'maria@empresa.com', '000.000.000-00', 'Analista', 'Matriz SP', 'Financeiro', '01/01/2024'], ';');
            fclose($handle);
        }, 200, $headers);
    }

    private function resolveUnidade(array $row): ?string
    {
        $unidade = trim($row['unidade'] ?? $row['area'] ?? $row['unidade_area'] ?? '');

        return $unidade !== '' ? $unidade : null;
    }

    private function parseDataAdmissao(?string $value): ?string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        foreach (['d/m/Y', 'Y-m-d', 'd-m-Y'] as $format) {
            try {
                return Carbon::createFromFormat($format, $value)->format('Y-m-d');
            } catch (\Throwable) {
                //
            }
        }

        return Carbon::parse($value)->format('Y-m-d');
    }
}
