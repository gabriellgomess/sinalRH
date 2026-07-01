<?php
 
namespace App\Http\Controllers\Api\Plataforma;
 
use App\Http\Controllers\Controller;
use App\Jobs\SincronizarCustomerAsaasJob;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
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

    public function store(Request $request): JsonResponse
    {
        if ($request->has('cnpj') && $request->cnpj !== null) {
            $request->merge([
                'cnpj' => preg_replace('/\D+/', '', $request->cnpj) ?: null
            ]);
        }

        $validated = $request->validate([
            'nome_fantasia'    => 'required|string|max:150',
            'razao_social'     => 'nullable|string|max:200',
            'cnpj'             => ['nullable', 'string', 'max:20', Rule::unique('empresas', 'cnpj')->whereNull('deleted_at')],
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
            'produto_tipo'                   => 'nullable|in:unica,recorrente,ambas',
            'produto_valor_unitario'         => 'nullable|numeric|min:0',
            'produto_valor_mensal'           => 'nullable|numeric|min:0',
            'produto_quantidade_aplicacoes'  => 'nullable|integer|min:1|max:12',
            'produto_limite_colaboradores'   => 'nullable|integer|min:1',
            'produto_data_inicio'            => 'nullable|date',
            'produto_observacoes'            => 'nullable|string|max:2000',
        ]);

        $plano = $validated['plano'] ?? 'pleno';
        $maxColaboradores = $validated['max_colaboradores'] ?? ($validated['produto_limite_colaboradores'] ?? 100);

        // O indice UNIQUE do banco em cnpj tambem conta empresas soft-deleted
        // (o MySQL nao suporta unique filtrado por deleted_at). Se um CNPJ estiver
        // preso por uma empresa ja excluida, libera-o antes de inserir a nova.
        if (!empty($validated['cnpj'])) {
            Empresa::onlyTrashed()->where('cnpj', $validated['cnpj'])->update(['cnpj' => null]);
        }

        $empresa = Empresa::create([
            'nome_fantasia'     => $validated['nome_fantasia'],
            'razao_social'      => $validated['razao_social'] ?? '',
            'cnpj'              => $validated['cnpj'] ?? null,
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

        // Produtos = ACESSO (sem cobranca). O financeiro fica nas Cobrancas avulsas.
        $produtosAcesso = $validated['produtos'] ?? (!empty($validated['contratar_produto']) ? [$validated['contratar_produto']] : []);
        foreach ($produtosAcesso as $prodKey) {
            $empresa->produtos()->create([
                'produto'              => $prodKey,
                'limite_colaboradores' => $validated['max_testes'] ?? ($validated['produto_limite_colaboradores'] ?? null),
                'data_inicio'          => $validated['produto_data_inicio'] ?? now()->toDateString(),
                'status'               => 'ativo',
                'contratado_por'       => $request->user()?->id ?? $admin->id,
            ]);
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

    public function update(Request $request, Empresa $empresa): JsonResponse
    {
        if ($request->has('cnpj') && $request->cnpj !== null) {
            $request->merge([
                'cnpj' => preg_replace('/\D+/', '', $request->cnpj) ?: null
            ]);
        }

        $validated = $request->validate([
            'nome_fantasia'    => 'sometimes|string|max:150',
            'razao_social'     => 'sometimes|string|max:200',
            'cnpj'             => ['sometimes', 'nullable', 'string', 'max:20', Rule::unique('empresas', 'cnpj')->ignore($empresa->id)->whereNull('deleted_at')],
            'email_contato'    => 'sometimes|email|max:150',
            'telefone'         => 'sometimes|string|max:20',
            'plano'            => 'sometimes|in:free,starter,pleno,enterprise',
            'status'           => 'sometimes|in:ativo,suspenso,cancelado',
            'max_colaboradores'=> 'sometimes|integer|min:1',
            'valor_mensal'     => 'sometimes|nullable|numeric|min:0',
        ]);

        $empresa->update($validated);

        return response()->json($empresa->fresh());
    }

    public function destroy(Empresa $empresa): JsonResponse
    {
        $empresa->delete();
        return response()->json(['message' => 'Empresa removida com sucesso.']);
    }
}
