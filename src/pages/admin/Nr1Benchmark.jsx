import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Grid, ShieldAlert, Calendar, BarChart2 } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { Button } from '../../components/ui/Button'
import { nr1AdminService } from '../../services/nr1Service'
import { formatDate } from '../../utils/formatters'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function Nr1Benchmark() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('geral')

  useEffect(() => {
    nr1AdminService.benchmark()
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data)
        } else {
          setError('Não foi possível carregar os dados de histórico.')
        }
      })
      .catch((err) => {
        console.error(err)
        setError('Ocorreu um erro ao carregar as avaliações.')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-rp-cinza-medio">
        Carregando histórico e benchmarking...
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center max-w-md mx-auto">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-4 border border-red-100 flex items-start gap-2">
          <ShieldAlert className="flex-shrink-0 mt-0.5" size={16} />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <Button onClick={() => navigate('/admin/nr1')}>Voltar para NR-1</Button>
      </div>
    )
  }

  const historicoAvaliacoes = data?.historico_avaliacoes ?? []
  const historicoSetores = data?.historico_setores ?? []

  // Validamos se há dados suficientes para plotar histórico (no mínimo 2 avaliações válidas)
  const validas = historicoAvaliacoes.filter(av => av.score_geral !== null)
  if (validas.length < 2) {
    return (
      <div>
        <PageTitle
          title="Histórico e Benchmark NR-1"
          subtitle="Acompanhe a evolução temporal dos riscos psicossociais"
        />
        <div className="bg-white rounded-2xl shadow-card p-8 text-center max-w-lg mx-auto mt-6">
          <div className="w-12 h-12 rounded-full bg-rp-azul-suave/30 flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={22} className="text-rp-azul" />
          </div>
          <h2 className="text-lg font-bold text-rp-azul mb-2">Dados insuficientes para histórico</h2>
          <p className="text-sm text-rp-cinza-medio leading-relaxed mb-6">
            Você precisa ter pelo menos duas avaliações (ativas ou encerradas) com respostas cadastradas para comparar a linha de evolução histórica da sua empresa.
          </p>
          <Button onClick={() => navigate('/admin/nr1')}>
            <ArrowLeft size={14} className="mr-1 inline" /> Voltar para o painel NR-1
          </Button>
        </div>
      </div>
    )
  }

  // Preparação de dados para o gráfico de evolução geral
  const chartGeralData = historicoAvaliacoes.map(av => ({
    name: av.titulo,
    'Score Geral': av.score_geral !== null ? av.score_geral : 0,
  }))

  // Preparação de dados para o gráfico de evolução por setor
  const chartSetorData = historicoAvaliacoes.map(av => {
    const row = { name: av.titulo }
    historicoSetores.forEach(setor => {
      const hist = setor.historico.find(h => h.avaliacao_id === av.id)
      if (hist && !hist.amostra_insuficiente && hist.score_geral !== null) {
        row[setor.setor_nome] = hist.score_geral
      } else {
        row[setor.setor_nome] = null
      }
    })
    return row
  })

  // Lista com as 10 dimensões/seções da NR-1 para a tabela comparativa
  const dimensoes = [
    { id: 1, label: 'Demandas de Trabalho' },
    { id: 2, label: 'Controle e Autonomia' },
    { id: 3, label: 'Clareza de Papel' },
    { id: 4, label: 'Relacionamentos e Justiça' },
    { id: 5, label: 'Reconhecimento e Recompensa' },
    { id: 6, label: 'Suporte e Segurança Psicológica' },
    { id: 7, label: 'Condições Organizacionais' },
    { id: 8, label: 'Gestão de Mudanças' },
    { id: 9, label: 'Segurança e Situações Críticas' },
    { id: 10, label: 'Integração e Trabalho Remoto' },
  ]

  const colors = [
    '#003366', '#ff7300', '#2ec4b6', '#e71d36', '#ff9f1c', 
    '#4cc9f0', '#7209b7', '#f72585', '#38b000', '#f15bb5'
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageTitle
          title="Histórico e Benchmark NR-1"
          subtitle="Acompanhe a evolução temporal dos riscos psicossociais da sua empresa"
        />
        <Button variant="secondary" onClick={() => navigate('/admin/nr1')}>
          <ArrowLeft size={14} className="mr-1 inline" /> Voltar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-rp-cinza-claro/50 p-1.5 rounded-xl w-fit border border-rp-cinza-borda/40">
        <button
          onClick={() => setActiveTab('geral')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'geral' ? 'bg-white text-rp-azul shadow-sm' : 'text-rp-cinza-medio hover:text-rp-texto'
          }`}
        >
          <TrendingUp size={16} /> Evolução Geral
        </button>
        <button
          onClick={() => setActiveTab('setor')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'setor' ? 'bg-white text-rp-azul shadow-sm' : 'text-rp-cinza-medio hover:text-rp-texto'
          }`}
        >
          <BarChart2 size={16} /> Evolução por Setor
        </button>
      </div>

      {/* Geral Tab */}
      {activeTab === 'geral' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Evolução Geral */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-rp-cinza-borda shadow-card">
              <h2 className="text-base font-bold text-rp-azul mb-4 flex items-center gap-1.5">
                <TrendingUp size={18} className="text-rp-azul" /> Evolução do Score Geral Global (0 a 100)
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartGeralData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#a0a0a0" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#a0a0a0" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0e0e0', fontSize: '12px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Score Geral" 
                      stroke="#003366" 
                      strokeWidth={3} 
                      activeDot={{ r: 6 }} 
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sumário das Avaliações */}
            <div className="bg-white p-5 rounded-2xl border border-rp-cinza-borda shadow-card flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-rp-azul mb-4 flex items-center gap-1.5">
                  <Calendar size={18} className="text-rp-azul" /> Histórico de Coletas
                </h2>
                <div className="space-y-3 overflow-y-auto max-h-[250px] pr-1">
                  {historicoAvaliacoes.map((av) => (
                    <div key={av.id} className="flex items-center justify-between border-b border-rp-cinza-borda/40 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs font-semibold text-rp-texto">{av.titulo}</p>
                        <p className="text-[10px] text-rp-cinza-medio mt-0.5">
                          {av.aplicada_em ? formatDate(av.aplicada_em) : '—'} · v{av.versao} · {av.total_respondentes} respostas
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        av.score_geral >= 70 ? 'bg-green-50 text-green-700' :
                        av.score_geral >= 50 ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {av.score_geral ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-rp-cinza-borda flex items-start gap-2 bg-blue-50/60 p-3 rounded-xl border border-blue-100/40">
                <Grid size={15} className="text-rp-azul flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-rp-azul leading-normal">
                  <strong>Nota técnica:</strong> O Score Geral baseia-se na média normalizada (0 a 100) das respostas Likert (1 a 5) em todas as 10 seções.
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de Evolução por Dimensão */}
          <div className="bg-white rounded-2xl border border-rp-cinza-borda shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-rp-cinza-borda">
              <h2 className="text-base font-bold text-rp-azul">Evolução Detalhada por Dimensão</h2>
              <p className="text-xs text-rp-cinza-medio mt-0.5">Compare os scores médios obtidos em cada seção ao longo das coletas</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-rp-cinza-borda bg-rp-cinza-claro/30">
                    <th className="px-5 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Dimensão / Seção</th>
                    {historicoAvaliacoes.map((av) => (
                      <th key={av.id} className="px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide text-center">
                        {av.titulo} <span className="block text-[9px] font-normal text-rp-cinza-medio mt-0.5">v{av.versao}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dimensoes.map((d) => (
                    <tr key={d.id} className="border-b border-rp-cinza-borda last:border-0 hover:bg-rp-cinza-claro/30 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-rp-texto">
                        {d.id}. {d.label}
                      </td>
                      {historicoAvaliacoes.map((av) => {
                        const secaoScore = av.por_secao?.find(s => s.secao === d.id)
                        const score = secaoScore ? secaoScore.score : null
                        return (
                          <td key={av.id} className="px-3 py-3 text-center">
                            <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                              score === null ? 'text-rp-cinza-medio bg-rp-cinza-claro/50' :
                              score >= 70 ? 'bg-green-100/70 text-green-800' :
                              score >= 50 ? 'bg-yellow-100/70 text-yellow-800' :
                              'bg-red-100/70 text-red-800'
                            }`}>
                              {score ?? '—'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Setor Tab */}
      {activeTab === 'setor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Evolução por Setor */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-rp-cinza-borda shadow-card">
              <h2 className="text-base font-bold text-rp-azul mb-4 flex items-center gap-1.5">
                <BarChart2 size={18} className="text-rp-azul" /> Comparativo Histórico por Setor (Score Geral)
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartSetorData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#a0a0a0" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#a0a0a0" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0e0e0', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                    {historicoSetores.map((setor, idx) => (
                      <Line
                        key={setor.setor_id}
                        type="monotone"
                        dataKey={setor.setor_nome}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Informações de Segmentação e LGPD */}
            <div className="bg-white p-5 rounded-2xl border border-rp-cinza-borda shadow-card flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-rp-azul mb-4 flex items-center gap-1.5">
                  <ShieldAlert size={18} className="text-rp-azul" /> Segurança de Dados (LGPD)
                </h2>
                <p className="text-xs text-rp-texto leading-relaxed mb-4">
                  A plataforma **Sinal RH** preza pelo anonimato e segurança psicológica dos colaboradores conforme as exigências da LGPD.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                    <ShieldAlert size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-yellow-800">Amostragem Mínima</h4>
                      <p className="text-[10px] text-yellow-700 leading-normal mt-0.5">
                        Setores com **menos de 5 respondentes** em uma determinada coleta terão seus scores e médias ocultados automaticamente (exibindo *amostra insuficiente*).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-rp-cinza-borda">
                <p className="text-[10px] text-rp-cinza-medio leading-normal">
                  Se um setor exibir **"Amostra insuficiente"** em uma das colunas, ele é excluído da linha histórica no gráfico correspondente para manter a privacidade dos respondentes daquele período.
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de Evolução por Setor */}
          <div className="bg-white rounded-2xl border border-rp-cinza-borda shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-rp-cinza-borda">
              <h2 className="text-base font-bold text-rp-azul">Tabela Comparativa de Setores</h2>
              <p className="text-xs text-rp-cinza-medio mt-0.5">Acompanhe a evolução do score de riscos psicossociais segmentado por setor</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-rp-cinza-borda bg-rp-cinza-claro/30">
                    <th className="px-5 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Setor</th>
                    {historicoAvaliacoes.map((av) => (
                      <th key={av.id} className="px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide text-center">
                        {av.titulo} <span className="block text-[9px] font-normal text-rp-cinza-medio mt-0.5">v{av.versao}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historicoSetores.length === 0 && (
                    <tr>
                      <td colSpan={historicoAvaliacoes.length + 1} className="px-5 py-12 text-center text-sm text-rp-cinza-medio">
                        Nenhum setor cadastrado para comparação.
                      </td>
                    </tr>
                  )}
                  {historicoSetores.map((setor) => (
                    <tr key={setor.setor_id} className="border-b border-rp-cinza-borda last:border-0 hover:bg-rp-cinza-claro/30 transition-colors">
                      <td className="px-5 py-3 text-sm font-semibold text-rp-texto">
                        {setor.setor_nome}
                      </td>
                      {historicoAvaliacoes.map((av) => {
                        const hist = setor.historico.find(h => h.avaliacao_id === av.id)
                        if (!hist) {
                          return <td key={av.id} className="px-3 py-3 text-center text-sm text-rp-cinza-medio">—</td>
                        }
                        if (hist.amostra_insuficiente) {
                          return (
                            <td key={av.id} className="px-3 py-3 text-center">
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-50 text-yellow-600 border border-yellow-100 rounded-full" title="Menos de 5 respostas coletadas">
                                Insuficiente
                              </span>
                            </td>
                          )
                        }
                        const score = hist.score_geral
                        return (
                          <td key={av.id} className="px-3 py-3 text-center">
                            <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                              score === null ? 'text-rp-cinza-medio bg-rp-cinza-claro/50' :
                              score >= 70 ? 'bg-green-100/70 text-green-800' :
                              score >= 50 ? 'bg-yellow-100/70 text-yellow-800' :
                              'bg-red-100/70 text-red-800'
                            }`}>
                              {score ?? '—'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
