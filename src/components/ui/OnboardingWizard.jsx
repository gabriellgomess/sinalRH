import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Upload, ShieldCheck, BarChart2, ArrowRight } from 'lucide-react'

const PASSOS = [
  {
    icon: Upload,
    titulo: 'Importe seus empregados',
    descricao: 'Crie setores e carregue a equipe em 1 clique via planilha CSV.',
    acao: 'Importar agora',
    rota: '/admin/empresa',
    cor: 'bg-blue-50 text-blue-600',
  },
  {
    icon: ShieldCheck,
    titulo: 'Faça uma avaliação NR-1',
    descricao: 'Mapeie os riscos psicossociais e gere o PGR regulatório.',
    acao: 'Criar avaliação',
    rota: '/admin/nr1/nova',
    cor: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: BarChart2,
    titulo: 'Explore o dashboard',
    descricao: 'Acompanhe check-ins, pesquisas e indicadores de clima em tempo real.',
    acao: 'Ver dashboard',
    rota: '/admin/dashboard',
    cor: 'bg-green-50 text-green-600',
  },
]

export function OnboardingWizard({ onConcluir }) {
  const navigate = useNavigate()
  const [fechando, setFechando] = useState(false)

  async function handleConcluir() {
    setFechando(true)
    await onConcluir()
  }

  if (fechando) return null

  return (
    <div className="mx-6 mt-6 mb-0 bg-white rounded-2xl shadow-card border border-rp-azul/10 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rp-azul to-[#002244]">
        <div>
          <h3 className="text-sm font-bold text-white">Bem-vindo ao Sinal RH! 🎉</h3>
          <p className="text-xs text-white/60 mt-0.5">Complete os passos abaixo para começar.</p>
        </div>
        <button
          onClick={handleConcluir}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 divide-x divide-rp-cinza-borda">
        {PASSOS.map((passo, i) => {
          const Icon = passo.icon
          return (
            <div key={i} className="p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${passo.cor}`}>
                <Icon size={18} />
              </div>
              <p className="text-sm font-semibold text-rp-texto mb-1">{passo.titulo}</p>
              <p className="text-xs text-rp-cinza-medio mb-4 leading-relaxed">{passo.descricao}</p>
              <button
                onClick={() => { handleConcluir(); navigate(passo.rota) }}
                className="flex items-center gap-1.5 text-xs font-semibold text-rp-azul hover:underline"
              >
                {passo.acao} <ArrowRight size={12} />
              </button>
            </div>
          )
        })}
      </div>

      <div className="px-6 py-3 bg-rp-cinza-claro border-t border-rp-cinza-borda flex items-center justify-between">
        <p className="text-xs text-rp-cinza-medio">
          Você pode voltar a este guia nas <strong>Configurações</strong> a qualquer momento.
        </p>
        <button
          onClick={handleConcluir}
          className="text-xs text-rp-cinza-medio hover:text-rp-texto font-medium transition-colors"
        >
          Já sei o que fazer, fechar →
        </button>
      </div>
    </div>
  )
}
