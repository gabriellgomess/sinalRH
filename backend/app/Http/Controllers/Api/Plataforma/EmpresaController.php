<?php
 
namespace App\Http\Controllers\Api\Plataforma;
 
use App\Http\Controllers\Controller;
use App\Jobs\SincronizarCustomerAsaasJob;
use App\Models\Empresa;
use App\Models\User;
use App\Services\AsaasService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
 
class EmpresaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empresas = Empresa::withCount([
                'colaboradores' => fn ($q) => $q->where('status', 'ativo'),
                'setores',
            ])
            ->with(['users' => fn ($q) => $q->where('perfil', 'admin')->select('id', 'nome', 'email', 'empresa_id')])
            ->when($request->search, fn ($q) => $q->where('nome_fantasia', 'like', "%{$request->search}%"))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->plano,  fn ($q) => $q->where('plano', $request->plano))
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($empresas);
    }

    public function store(Request $request, AsaasService $asaas): JsonResponse
    {
        if ($request->has('cnpj') && $request->cnpj !== null) {
            $request->merge([
                'cnpj' => preg_replace('/\D+/', '', $request->cnpj) ?: null
            ]);
        }

        $validated = $request->validate([
            'nome_fantasia'    => 'required|string|max:150',
            'razao_social'     => 'nullable|string|max:200',
            'cnpj'             => 'nullable|string|max:20|unique:empresas,cnpj',
            'email_contato'    => 'nullable|email|max:150',
            'telefone'         => 'nullable|string|max:20',
            'plano'            => 'nullable|in:free,starter,pleno,enterprise',
            'max_colaboradores'=> 'nullable|integer|min:1',
            'admin_nome'       => 'required|string|max:150',
            'admin_email'      => 'required|email|unique:users,email',
            'admin_senha'      => 'nullable|string|min:8|max:100',
            
            // Novos campos para cadastro simplificado
            'valor_mensal'     => 'nullable|numeric|min:0',
            'max_testes'       => 'nullable|integer|min:1',
            'produtos'         => 'nullable|array',
            'produtos.*'       => 'string|in:diagnostico_nr1,plano_acao_nr1,canal_escuta,mapa_riscos,pesquisas,checkins,feedback,pdi',

            // Contratação de Produto Inicial Opcional
            'contratar_produto'              => 'nullable|in:diagnostico_nr1,plano_acao_nr1,canal_escuta,mapa_riscos,pesquisas,checkins,feedback,pdi',
            'produto_tipo'                   => 'nullable|in:pontual,recorrente_mensal',
            'produto_valor_unitario'         => 'nullable|numeric|min:0',
            'produto_valor_mensal'           => 'nullable|numeric|min:0',
            'produto_quantidade_aplicacoes'  => 'nullable|integer|min:1|max:12',
            'produto_limite_colaboradores'   => 'nullable|integer|min:1',
            'produto_data_inicio'            => 'nullable|date',
            'produto_observacoes'            => 'nullable|string|max:2000',
        ]);

        $plano = $validated['plano'] ?? 'pleno';
        $maxColaboradores = $validated['max_colaboradores'] ?? ($validated['produto_limite_colaboradores'] ?? 100);

        $empresa = Empresa::create([
            'nome_fantasia'     => $validated['nome_fantasia'],
            'razao_social'      => $validated['razao_social'] ?? '',
            'cnpj'              => $validated['cnpj'] ?? '',
            'email_contato'     => $validated['email_contato'] ?? '',
            'telefone'          => $validated['telefone'] ?? '',
            'plano'             => $plano,
            'status'            => 'ativo',
            'max_colaboradores' => $maxColaboradores,
            'valor_mensal'      => $validated['valor_mensal'] ?? null,
        ]);

        $senha = !empty($validated['admin_senha']) ? $validated['admin_senha'] : Str::password(12, true, true, false);

        $admin = User::create([
            'nome'       => $validated['admin_nome'],
            'email'      => $validated['admin_email'],
            'password'   => Hash::make($senha),
            'perfil'     => 'admin',
            'empresa_id' => $empresa->id,
        ]);

        // Dispara criação do cliente Asaas
        SincronizarCustomerAsaasJob::dispatch($empresa);

        // Se houver lista de produtos (cadastro simplificado), cria-os e tenta sincronizar
        if (!empty($validated['produtos'])) {
            foreach ($validated['produtos'] as $prodKey) {
                $prodDef = \App\Models\EmpresaProduto::PRODUTOS[$prodKey] ?? ['tipo' => 'recorrente_mensal'];
                $empresa->produtos()->create([
                    'produto'              => $prodKey,
                    'tipo'                 => $prodDef['tipo'] ?? 'recorrente_mensal',
                    'limite_colaboradores' => $validated['max_testes'] ?? null,
                    'data_inicio'          => now()->toDateString(),
                    'status'               => 'ativo',
                    'contratado_por'       => $request->user()?->id ?? $admin->id,
                ]);
            }

            try {
                $asaas->syncAssinaturaConsolidada($empresa);
                $asaas->syncPagamentoConsolidado($empresa);
            } catch (\Throwable $e) {
                Log::error("Falha ao sincronizar produtos unificados no Asaas para nova empresa {$empresa->id}: " . $e->getMessage());
            }
        } elseif (!empty($validated['contratar_produto'])) {
            // Se houver produto inicial contratado, cria-o e tenta sincronizar
            $produto = $empresa->produtos()->create([
                'produto'               => $validated['contratar_produto'],
                'tipo'                  => $validated['produto_tipo'] ?? 'pontual',
                'valor_unitario'        => $validated['produto_valor_unitario'] ?? null,
                'valor_mensal'          => $validated['produto_valor_mensal'] ?? null,
                'quantidade_aplicacoes' => $validated['produto_quantidade_aplicacoes'] ?? null,
                'limite_colaboradores'  => $validated['produto_limite_colaboradores'] ?? null,
                'data_inicio'           => $validated['produto_data_inicio'] ?? now()->toDateString(),
                'observacoes'           => $validated['produto_observacoes'] ?? null,
                'status'                => 'ativo',
                'contratado_por'        => $request->user()?->id ?? $admin->id,
            ]);

            try {
                $asaas->syncProduto($produto);
            } catch (\Throwable $e) {
                Log::error("Falha ao sincronizar produto inicial no Asaas para nova empresa {$empresa->id}", [
                    'produto_id' => $produto->id,
                    'erro'       => $e->getMessage(),
                ]);
                \App\Jobs\SincronizarProdutoAsaasJob::dispatch($produto)->delay(now()->addSeconds(30));
            }
        }

        return response()->json([
            'empresa' => $empresa,
            'acesso'  => [
                'nome'  => $admin->nome,
                'email' => $admin->email,
                'senha' => $senha,
            ],
        ], 201);
    }

    public function show(Empresa $empresa): JsonResponse
    {
        $empresa->load([
            'users' => fn ($q) => $q->whereIn('perfil', ['admin', 'gestor', 'consultor'])
                                    ->select('id', 'nome', 'email', 'perfil', 'cargo', 'empresa_id'),
            'setores:id,empresa_id,nome,unidade',
        ]);

        $empresa->loadCount([
            'colaboradores' => fn ($q) => $q->where('status', 'ativo'),
            'setores',
            'pesquisas',
        ]);

        return response()->json($empresa);
    }

    public function update(Request $request, Empresa $empresa, AsaasService $asaas): JsonResponse
    {
        if ($request->has('cnpj') && $request->cnpj !== null) {
            $request->merge([
                'cnpj' => preg_replace('/\D+/', '', $request->cnpj) ?: null
            ]);
        }

        $validated = $request->validate([
            'nome_fantasia'    => 'sometimes|string|max:150',
            'razao_social'     => 'sometimes|string|max:200',
            'cnpj'             => 'sometimes|string|max:20|unique:empresas,cnpj,' . $empresa->id,
            'email_contato'    => 'sometimes|email|max:150',
            'telefone'         => 'sometimes|string|max:20',
            'plano'            => 'sometimes|in:free,starter,pleno,enterprise',
            'status'           => 'sometimes|in:ativo,suspenso,cancelado',
            'max_colaboradores'=> 'sometimes|integer|min:1',
            'valor_mensal'     => 'sometimes|nullable|numeric|min:0',
        ]);

        $empresa->update($validated);

        if ($request->has('valor_mensal')) {
            try {
                $asaas->syncAssinaturaConsolidada($empresa);
            } catch (\Throwable $e) {
                Log::error("Falha ao sincronizar assinatura após atualizar valor_mensal da empresa {$empresa->id}: {$e->getMessage()}");
            }
        }

        return response()->json($empresa->fresh());
    }

    public function destroy(Empresa $empresa): JsonResponse
    {
        $empresa->delete();
        return response()->json(['message' => 'Empresa removida com sucesso.']);
    }
}
