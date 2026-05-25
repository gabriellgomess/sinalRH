import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, ChevronDown, ChevronUp, MessageSquare, Target, Sparkles,
  Heart, FileText, Map, Brain, MessageCircle, Settings2, Shield, Lock,
  Eye, FileCheck, AlertTriangle,
} from 'lucide-react'
import SaraLinharConsultoria from '../../assets/profile-pic.png'
import LogoHorizontal from '../../assets/logo_horizontal.png'


const HEADER_LINKS = [
  { href: '#produto',     label: 'Como funciona' },
  { href: '#recursos',    label: 'Recursos' },
  // { href: '#precos',      label: 'Produtos' },
  { href: '#comparativo', label: 'Comparativo' },
  { href: '#seguranca',   label: 'Segurança' },
]

const ETAPAS = [
  {
    n: '01',
    titulo: 'Escute',
    icon: MessageSquare,
    desc: 'Check-ins semanais de 3 minutos, pesquisas de clima trimestrais e canal anônimo de escuta. Tudo num só lugar, com tom humano.',
  },
  {
    n: '02',
    titulo: 'Antecipe',
    icon: Target,
    desc: 'O algoritmo do SinalRH cruza respostas, padrões e sinais para destacar setores e pessoas em risco — antes que o problema fique caro. A decisão final é sempre do RH.',
    destaque: true,
  },
  {
    n: '03',
    titulo: 'Aja',
    icon: Sparkles,
    desc: 'Receba planos de ação prontos por setor e relatórios executivos que cabem em 1 página. RH vira parceiro estratégico da diretoria.',
  },
]

const RECURSOS = [
  { icon: Heart,          titulo: 'Check-ins semanais',   desc: 'Pulso de 3 perguntas que cabem no celular. Resposta média: 2min12s.' },
  { icon: FileText,       titulo: 'Pesquisas de clima',   desc: 'eNPS, engajamento e clima organizacional com benchmarks por setor.' },
  { icon: Map,            titulo: 'Mapa de riscos',       desc: 'Heatmap por setor e indicador. Veja onde o sinal está vermelho.' },
  { icon: Brain,          titulo: 'Relatórios automatizados', desc: 'Resumo executivo automático com causas, recomendações e próximos passos — revisados pela consultoria antes de ir pra diretoria.', destaque: true },
  { icon: MessageCircle,  titulo: 'Canal de escuta',      desc: 'Denúncias e feedback anônimos com triagem inteligente e SLA.' },
  { icon: FileCheck,      titulo: 'NR-1 / PGR',           desc: 'Avaliação psicossocial conforme Portaria MTE 1.419/2024 com PDF regulatório completo.' },
]

const PRODUTOS = [
  {
    key: 'diagnostico',
    tag: 'Serviço Principal · Porta de Entrada',
    titulo: 'Diagnóstico Psicossocial NR-1',
    sub: 'Atenda à Portaria MTE 1.419/2024 com avaliação anônima, score por dimensão e PDF regulatório completo.',
    valor: 'R$ 30',
    valorSub: 'por colaborador / aplicação',
    frequencia: 'Cobrança Única (Pontual)',
    principal: true,
    cta: 'Solicitar diagnóstico',
    itens: [
      'Checklist anônimo de 40 itens (10 dimensões alinhadas à NR-1/PGR e ISO 45003)',
      'Filtros por setor, sexo e faixa etária',
      'Inventário automático de riscos críticos',
      'PDF regulatório com assinatura formal',
      'Reaplicação versionada (v1.0 → v2.0)',
      'Importação de colaboradores em 1 CSV',
    ],
  },
  {
    key: 'plano',
    tag: 'Para manter o ciclo vivo',
    titulo: 'Plano de Ação Continuado',
    sub: 'Acompanhamento mensal das ações corretivas e preventivas com reuniões de consultoria. Dossiê pronto.',
    valor: 'R$ 10',
    valorSub: 'por colaborador / mês',
    frequencia: 'Assinatura Recorrente Mensal',
    destaque: true,
    cta: 'Falar com a consultoria',
    itens: [
      'Plano de ação por setor com prazos e responsáveis',
      'Cronograma Gantt com indicador de atraso',
      'Evidências anexadas por ação (atas, treinamentos)',
      'Dossiê estruturado (11 pastas) para fiscalização',
      'Histórico de versões com comparativo de scores',
      'Reuniões mensais com a consultoria Sara Linhar',
    ],
  },
  {
    key: 'escuta',
    tag: 'Canal Seguro · Em Breve',
    titulo: 'Canal de Escuta Profissional',
    sub: 'Denúncias e feedback anônimos com triagem inteligente, criptografia e SLA contratual.',
    valor: 'R$ 5',
    valorSub: 'por colaborador / mês',
    frequencia: 'Assinatura Recorrente Mensal',
    futuro: true,
    cta: 'Tenho interesse',
    itens: [
      'Canal 100% anônimo com criptografia',
      'Triagem inteligente por categoria e prioridade',
      'SLA de resposta contratual',
      'Encaminhamento para DPO/Comitê de Ética',
      'Dashboard de tendências',
      'Lançamento previsto: 2026/2',
    ],
  },
]

const COMPARATIVO = [
  { categoria: 'Aplicação do Diagnóstico', itens: [
    ['Coleta anônima online com escala S/P/N',  true, 'Manual em planilha'],
    ['Filtros por setor, sexo e faixa etária',  true, 'Trabalhoso'],
    ['Reaplicação versionada (v1.0 → v2.0)',    true, 'Cada ciclo começa do zero'],
    ['Cálculo automático de score por dimensão', true, 'Manual'],
  ]},
  { categoria: 'Documentação para Auditoria', itens: [
    ['Dossiê estruturado (11 pastas NR-1)',         true, 'Pastas no Drive sem padrão'],
    ['Upload de evidências por ação',               true, 'E-mail/anexos dispersos'],
    ['Geração de ZIP completo para o auditor',      true, 'Compilação manual'],
    ['Histórico versionado de revisões',            true, 'Versões controladas a mão'],
  ]},
  { categoria: 'Plano de Ação Continuado', itens: [
    ['Cronograma Gantt com indicador de atraso',     true, 'Planilha estática'],
    ['Plano com responsável, prazo e prioridade',    true, 'Documento Word'],
    ['Anexos por ação (atas, treinamentos)',         true, 'Arquivos soltos'],
    ['Reuniões mensais com a consultoria',           true, true],
  ]},
  { categoria: 'PDF Regulatório', itens: [
    ['Capa institucional + sumário + metodologia',   true, 'Modelo Word'],
    ['Inventário automático de itens críticos',      true, 'Análise manual'],
    ['Plano de ação integrado ao PDF',               true, 'Anexo separado'],
    ['Termo de aprovação com assinatura formal',     true, true],
  ]},
]

const FAQ = [
  {
    q: 'Como é a contratação? Tem trial gratuito?',
    a: 'Não é SaaS self-service. Você fala com a consultoria, recebemos uma proposta técnica e o serviço começa pelo Diagnóstico Psicossocial. Não há trial — mas a primeira reunião de alinhamento é sem custo.',
  },
  {
    q: 'O Diagnóstico de R$ 30/colaborador inclui o quê?',
    a: 'Inclui as 2 aplicações no ano (semestral), análise dos resultados, inventário de riscos críticos, PDF regulatório conforme Portaria MTE 1.419/2024 e a reunião de devolutiva com a consultoria. O valor é por colaborador respondente, por aplicação.',
  },
  {
    q: 'Posso contratar só o Diagnóstico ou preciso fechar o Plano de Ação também?',
    a: 'Pode começar só pelo Diagnóstico — atende a obrigação regulatória de avaliação. O Plano de Ação Continuado é recomendado quando o resultado mostra riscos críticos ou quando a empresa quer manter o ciclo vivo entre aplicações, mas é opcional.',
  },
  {
    q: 'Como vocês cumprem a NR-1 / PGR?',
    a: 'O Diagnóstico segue a Portaria MTE 1.419/2024 com checklist de 10 dimensões alinhadas à NR-1/PGR e ISO 45003. O PDF gerado contém capa institucional, metodologia, inventário de riscos, plano de ação e termo de aprovação — pronto para apresentação em fiscalização. O Plano de Ação Continuado mantém o dossiê de evidências em 11 pastas estruturadas.',
  },
  {
    q: 'Como funciona a anonimização das respostas?',
    a: 'Cada respondente é identificado apenas por setor, faixa etária e sexo. Não coletamos nome, CPF nem e-mail. O processo é auditado e segue a LGPD (Lei 13.709/2018). Nem administradores conseguem identificar quem respondeu o quê.',
  },
  {
    q: 'Quem é a Sara Linhar Consultoria?',
    a: 'Consultoria especializada em saúde organizacional e gestão de pessoas, com atuação em diagnóstico psicossocial, planos de ação e cumprimento regulatório. A SinalRH é a plataforma criada pela consultoria para estruturar e auditar os ciclos PGR dos seus clientes.',
  },
]

const NUMEROS = [
  { v: '38%',    sub: 'redução média de turnover em 6 meses', nota: '*projeção baseada em casos de mercado' },
  { v: '4 sem.', sub: 'até o primeiro insight acionável' },
  { v: 'R$ 14k', sub: 'economia projetada por desligamento evitado', nota: '*Robert Half, 2024' },
  { v: 'NR-1',   sub: 'PGR regulatório pronto para fiscalização' },
]

function Cell({ valor }) {
  if (valor === true) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-50">
        <Check size={14} className="text-rp-laranja" strokeWidth={3} />
      </span>
    )
  }
  if (valor === '—' || valor === false) {
    return <span className="text-gray-300">—</span>
  }
  return <span className="text-xs text-rp-cinza-medio">{valor}</span>
}

export default function Landing() {
  const [faqAberto, setFaqAberto] = useState(0)
  const [colaboradores, setColaboradores] = useState(100)
  const [incluirDiagnostico, setIncluirDiagnostico] = useState(true)
  const [incluirPlano, setIncluirPlano] = useState(false)
  const [incluirEscuta, setIncluirEscuta] = useState(false)

  const precoDiagnostico = incluirDiagnostico ? colaboradores * 30 : 0
  const precoPlano = incluirPlano ? colaboradores * 10 : 0
  const precoEscuta = incluirEscuta ? colaboradores * 5 : 0

  const totalUnico = precoDiagnostico
  const totalMensal = precoPlano + precoEscuta

  return (
    <div className="bg-white text-rp-texto">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-rp-cinza-borda py-4">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={LogoHorizontal} alt="SinalRH" className="h-16" />
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            {HEADER_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-rp-texto hover:text-rp-azul transition-colors">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/admin/login" className="text-sm font-semibold text-rp-texto hover:text-rp-azul transition-colors">
              Entrar
            </Link>
            <a
              href="#contato"
              className="bg-rp-azul text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-rp-azul/90 transition-colors"
            >
              Solicitar diagnóstico
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section id="produto" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/40 rounded-full -translate-y-1/3 translate-x-1/4" aria-hidden />
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <span className="inline-block px-3 py-1 bg-orange-50 text-rp-laranja text-xs font-bold rounded-full mb-6 uppercase tracking-wide">
              People Analytics · LGPD
            </span>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Antecipe a próxima <span className="text-rp-laranja">demissão antes que ela aconteça</span>.
            </h1>
            <p className="text-lg text-rp-cinza-medio mb-8 leading-relaxed max-w-lg">
              SinalRH transforma o clima da sua equipe em dados acionáveis.
              Reduza o turnover em até 38%* com sinais precoces de desengajamento
              e relatórios executivos automatizados, revisados pela consultoria humana.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <a
                href="#contato"
                className="inline-flex items-center gap-2 bg-rp-laranja text-white px-6 py-3 rounded-xl font-bold hover:bg-rp-laranja/90 transition-colors"
              >
                Solicitar diagnóstico <ArrowRight size={16} />
              </a>
              <a
                href="#contato"
                className="inline-flex items-center gap-2 border-2 border-rp-azul text-rp-azul px-6 py-3 rounded-xl font-bold hover:bg-rp-azul hover:text-white transition-colors"
              >
                Agendar conversa
              </a>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-rp-cinza-medio">
              <span className="flex items-center gap-1.5"><Check size={13} className="text-green-600" /> Atende NR-1 / Portaria 1.419/2024</span>
              <span className="flex items-center gap-1.5"><Check size={13} className="text-green-600" /> Conforme LGPD</span>
              <span className="flex items-center gap-1.5"><Check size={13} className="text-green-600" /> Consultoria + plataforma</span>
            </div>
          </div>

          {/* Mockup do dashboard */}
          <div className="relative h-[440px]">
            <div className="absolute top-4 right-4 w-48 h-48 bg-orange-100/40 rounded-full" style={{ backgroundImage: `url(${SaraLinharConsultoria})`, backgroundSize: 'cover', backgroundPosition: 'center' }} aria-hidden>
            </div>
            <div className="absolute top-0 right-0 w-72 h-72 border-2 border-rp-azul/15 rounded-full" aria-hidden />

            <div className="absolute top-6 left-6 bg-rp-laranja text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-lg shadow-lg">
              38%
            </div>
            <div className="absolute top-9 left-28 bg-white shadow-card rounded-lg px-3 py-1.5 text-xs font-medium">
              menos turnover
            </div>

            <div className="absolute bottom-32 left-2 bg-white rounded-xl shadow-card p-4 w-72">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-rp-texto">Engajamento por setor</p>
                <span className="text-[10px] text-rp-cinza-medio">últimos 30 dias</span>
              </div>
              <div className="flex items-end gap-1.5 h-20">
                {[60, 90, 75, 50, 30, 55].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`flex-1 rounded-t ${i === 4 ? 'bg-red-400' : i === 3 ? 'bg-rp-laranja' : 'bg-rp-azul'}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-rp-cinza-medio mt-1.5">
                <span>Vend.</span><span>Eng.</span><span>Ops.</span><span>Mkt.</span><span>TI</span><span>Fin.</span>
              </div>
              <p className="text-[10px] mt-2 text-red-600 font-semibold">2 setores em risco · <span className="text-green-600">↑ 12% vs mês passado</span></p>
            </div>

            <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-card p-4 w-64">
              <div className="flex items-center gap-1.5 mb-3">
                <AlertTriangle size={14} className="text-rp-laranja" />
                <p className="text-xs font-bold">Alerta: TI</p>
                <span className="text-[10px] text-rp-cinza-medio">queda em 3 indicadores</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span>Engajamento</span><span className="text-red-600 font-bold">↓18%</span></div>
                <div className="flex justify-between"><span>Satisfação</span><span className="text-red-600 font-bold">↓12%</span></div>
                <div className="flex justify-between"><span>Resposta a check-ins</span><span className="text-rp-laranja font-bold">62%</span></div>
              </div>
              <button className="w-full mt-3 bg-rp-azul text-white text-[11px] font-bold py-2 rounded-lg">
                Ver plano de ação
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Custo do silêncio ──────────────────────────────────────── */}
      <section className="bg-rp-azul-profundo text-white py-16 lg:py-20" style={{ background: '#002244' }}>
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 bg-rp-laranja/20 text-rp-laranja text-xs font-bold rounded-full mb-5 uppercase tracking-wide">
              O custo do silêncio
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Uma demissão custa em média <span className="text-rp-laranja">14× o salário mensal</span>.
            </h2>
            <p className="text-white/80 leading-relaxed mb-8 max-w-md">
              E ainda assim, 7 em cada 10 desligamentos pegam o RH de surpresa.
              Sem sinais antecipados, líderes só descobrem o problema quando a
              carta já chegou.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-4xl font-bold text-rp-laranja">R$ 84k</p>
                <p className="text-xs text-white/60 mt-1">custo médio de um desligamento de média gestão*</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-rp-laranja">7 / 10</p>
                <p className="text-xs text-white/60 mt-1">demissões pegam o RH de surpresa*</p>
              </div>
            </div>
            <p className="text-[10px] text-white/40 mt-3">*Robert Half (2024) · projeção baseada em casos de mercado</p>
          </div>

          {/* Timeline */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Linha do tempo · um caso comum</p>
            <div className="space-y-3">
              {[
                ['Semana 1',  'Atrasos sutis nas reuniões',     'bg-yellow-300'],
                ['Semana 4',  'Respostas curtas no Slack',       'bg-yellow-400'],
                ['Semana 7',  'Saída da câmera fechada',         'bg-orange-400'],
                ['Semana 9',  'Conflitos com a liderança',       'bg-orange-500'],
                ['Semana 11', 'Pedidos de demissão silenciosos', 'bg-red-500'],
                ['Semana 12', 'Carta na mesa',                   'bg-red-600', 'PERDA'],
              ].map(([sem, ev, cor, badge]) => (
                <div key={sem} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-white/40 w-20">{sem}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${cor} flex-shrink-0`} />
                  <span className="text-white/90 flex-1">{ev}</span>
                  {badge && <span className="text-[9px] font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">{badge}</span>}
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-xs text-rp-laranja">
                <strong>Com SinalRH:</strong> <span className="text-white/80">os primeiros sinais já acendem alertas na semana 2.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 etapas ───────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-orange-50 text-rp-laranja text-xs font-bold rounded-full mb-4 uppercase tracking-wide">
              Como funciona
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
              Três etapas para <span className="text-rp-laranja">sair do achismo</span>.
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {ETAPAS.map(e => {
              const Icon = e.icon
              const isDestaque = e.destaque
              return (
                <div
                  key={e.n}
                  className={`relative rounded-2xl p-7 ${isDestaque ? 'bg-rp-azul-profundo text-white' : 'bg-white border border-rp-cinza-borda'}`}
                  style={isDestaque ? { background: '#002244' } : {}}
                >
                  <span className={`absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${isDestaque ? 'bg-rp-laranja text-white' : 'bg-rp-laranja text-white'}`}>
                    {e.n}
                  </span>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${isDestaque ? 'bg-white/10' : 'bg-orange-50'}`}>
                    <Icon size={20} className={isDestaque ? 'text-white' : 'text-rp-laranja'} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-3 ${isDestaque ? '' : 'text-rp-texto'}`}>{e.titulo}</h3>
                  <p className={`text-sm leading-relaxed mb-4 ${isDestaque ? 'text-white/80' : 'text-rp-cinza-medio'}`}>
                    {e.desc}
                  </p>
                  <a href="#recursos" className={`text-sm font-bold flex items-center gap-1 ${isDestaque ? 'text-rp-laranja' : 'text-rp-azul'}`}>
                    Saiba mais <ArrowRight size={14} />
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Recursos ───────────────────────────────────────────────── */}
      <section id="recursos" className="bg-rp-cinza-claro py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <span className="inline-block px-3 py-1 bg-orange-50 text-rp-laranja text-xs font-bold rounded-full mb-4 uppercase tracking-wide">
                Recursos
              </span>
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                Tudo que o RH precisa, <span className="text-rp-laranja">numa só plataforma</span>.
              </h2>
            </div>
            <a href="#precos" className="text-sm font-bold text-rp-azul flex items-center gap-1">
              Ver todos os recursos <ArrowRight size={14} />
            </a>
          </div>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
            {RECURSOS.map((r, i) => {
              const Icon = r.icon
              const dest = r.destaque
              return (
                <div
                  key={i}
                  className={`rounded-2xl p-6 ${dest ? 'bg-rp-azul-profundo text-white' : 'bg-white border border-rp-cinza-borda'}`}
                  style={dest ? { background: '#002244' } : {}}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${dest ? 'bg-white/10' : 'bg-orange-50'}`}>
                    <Icon size={18} className={dest ? 'text-white' : 'text-rp-laranja'} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{r.titulo}</h3>
                  <p className={`text-sm leading-relaxed ${dest ? 'text-white/75' : 'text-rp-cinza-medio'}`}>
                    {r.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Números ────────────────────────────────────────────────── */}
      <section className="py-14" style={{ background: '#002244' }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 text-white">
          {NUMEROS.map((n, i) => (
            <div key={i}>
              <p className="text-4xl lg:text-5xl font-bold text-rp-laranja">{n.v}</p>
              <p className="text-xs text-white/70 mt-2 leading-snug">{n.sub}</p>
              {n.nota && <p className="text-[9px] text-white/40 mt-1">{n.nota}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Quem está por trás ─────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src="/assets/imagens/fotodiretora.jpg"
              alt="Sara Linhar, fundadora"
              className="rounded-2xl shadow-card w-full max-w-md"
            />
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-orange-50 text-rp-laranja text-xs font-bold rounded-full mb-4 uppercase tracking-wide">
              Quem está por trás
            </span>
            <h2 className="text-4xl font-bold leading-tight mb-5">
              Tecnologia + <span className="text-rp-laranja">consultoria humana</span>.
            </h2>
            <p className="text-rp-cinza-medio leading-relaxed mb-4">
              O SinalRH é uma iniciativa da <strong>Sara Linhar Consultoria</strong>,
              especializada em saúde organizacional e gestão de pessoas.
              Cada cliente conta com tecnologia de ponta e olhar humano para
              transformar dados em decisões que fazem sentido.
            </p>
            <p className="text-rp-cinza-medio leading-relaxed">
              Construído em parceria com escritórios de DPO e auditores independentes,
              para garantir conformidade total com a LGPD e a NR-1.
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm">
              <a href="#contato" className="text-rp-azul font-bold hover:underline">Conhecer a consultoria →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Segurança ──────────────────────────────────────────────── */}
      <section id="seguranca" className="bg-rp-cinza-claro py-20">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[280px_1fr] gap-12 items-center">
          <div className="bg-white border-2 border-rp-azul rounded-2xl p-10 relative">
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-rp-laranja rounded-full flex items-center justify-center text-white">
              <Check size={16} strokeWidth={3} />
            </div>
            <Shield size={56} className="mx-auto text-rp-azul mb-3" strokeWidth={1.5} />
            <p className="text-center text-xs font-bold text-rp-azul tracking-widest">CONFORME LGPD</p>
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-orange-50 text-rp-laranja text-xs font-bold rounded-full mb-4 uppercase tracking-wide">
              Segurança & Privacidade
            </span>
            <h2 className="text-4xl font-bold leading-tight mb-5">
              Dados de gente exigem o mais <span className="text-rp-laranja">alto cuidado</span>.
            </h2>
            <p className="text-rp-cinza-medio leading-relaxed mb-6">
              SinalRH é construído em parceria com escritórios de DPO e auditores
              independentes. Cada resposta passa por um pipeline criptografado, com
              anonimização nativa e direito ao esquecimento em 1 clique.
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {[
                { icon: Lock,      label: 'Criptografia AES-256 em repouso e em trânsito' },
                { icon: Shield,    label: 'Conformidade LGPD com DPO designado' },
                { icon: Eye,       label: 'Anonimização nativa para respostas sensíveis' },
                { icon: FileCheck, label: 'Logs auditáveis e direito ao esquecimento' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-white border border-rp-cinza-borda rounded-lg px-3 py-2.5">
                  <Icon size={14} className="text-rp-azul flex-shrink-0" />
                  <span className="text-xs text-rp-texto">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {false && (
        <section id="precos" className="py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] bg-blue-50/40 rounded-full -translate-x-1/2 -translate-y-1/2" aria-hidden />
          <div className="max-w-6xl mx-auto px-6 relative">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 bg-orange-50 text-rp-laranja text-xs font-bold rounded-full mb-4 uppercase tracking-wide">
                Catálogo de Serviços
              </span>
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
                Nossos <span className="text-rp-laranja">produtos e serviços</span>.
              </h2>
              <p className="text-sm text-rp-cinza-medio max-w-2xl mx-auto">
                Cobrança transparente de consultoria + plataforma para cumprir a NR-1 com segurança.
                Comece pelo Diagnóstico (Cobrança Única) e adicione o acompanhamento mensal (Assinatura Recorrente) conforme necessário.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
              {PRODUTOS.map(produto => {
                const dest = produto.destaque
                const futuro = produto.futuro
                const principal = produto.principal
                return (
                  <div
                    key={produto.key}
                    className={`relative rounded-2xl p-8 flex flex-col ${
                      dest ? 'text-white shadow-2xl scale-102 border-2 border-rp-azul' : 'bg-white border border-rp-cinza-borda'
                    } ${futuro ? 'opacity-90' : ''} transition-all duration-300 hover:shadow-lg`}
                    style={dest ? { background: '#002244' } : {}}
                  >
                    {dest && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rp-azul text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Acompanhamento
                      </span>
                    )}
                    {principal && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rp-laranja text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-md">
                        Serviço Principal
                      </span>
                    )}
                    {futuro && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-400 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Em breve
                      </span>
                    )}

                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${dest ? 'text-rp-laranja' : 'text-rp-cinza-medio'}`}>
                      {produto.tag}
                    </p>
                    <h3 className="text-2xl font-bold mb-2 leading-tight">{produto.titulo}</h3>
                    <p className={`text-xs mb-5 ${dest ? 'text-white/70' : 'text-rp-cinza-medio'}`}>
                      {produto.sub}
                    </p>

                    <div className="mb-5">
                      <span className={`text-3xl font-bold ${dest ? '' : 'text-rp-texto'}`}>{produto.valor}</span>
                      <span className={`text-xs block mt-1 ${dest ? 'text-white/60' : 'text-rp-cinza-medio'}`}>{produto.valorSub}</span>
                      <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded ${dest ? 'bg-white/10 text-white/80' : 'bg-orange-50 text-rp-laranja'}`}>
                        {produto.frequencia}
                      </span>
                    </div>

                    <a
                      href="#contato"
                      className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-colors mb-6 ${
                        dest ? 'bg-rp-laranja text-white hover:bg-rp-laranja/90 shadow-sm'
                        : futuro ? 'bg-rp-cinza-claro text-rp-cinza-medio hover:bg-rp-cinza-borda'
                        : 'bg-rp-azul text-white hover:bg-rp-azul/90 shadow-sm'
                      }`}
                    >
                      {produto.cta} →
                    </a>

                    <p className={`text-[10px] font-bold uppercase mb-2.5 ${dest ? 'text-white/50' : 'text-rp-cinza-medio'}`}>
                      O que está incluso:
                    </p>
                    <ul className="space-y-2.5 text-sm flex-1">
                      {produto.itens.map(i => (
                        <li key={i} className={`flex gap-2 ${dest ? 'text-white/90' : ''}`}>
                          <Check size={14} className={`${dest ? 'text-rp-laranja' : 'text-green-600'} flex-shrink-0 mt-1`} />
                          {i}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            <div className="max-w-3xl mx-auto mt-10 bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-rp-texto">
              <strong className="text-rp-azul">Como funciona na prática:</strong> você contrata o
              Diagnóstico Psicossocial NR-1 (Cobrança Única). Aplicamos a avaliação regulatória e entregamos os relatórios.
              Caso os resultados demonstrem a necessidade de acompanhar o cronograma continuado, você ativa o Plano de Ação (Mensal) e a consultoria audita suas 11 pastas mensais para fiscalização, unificando as assinaturas.
            </div>

            {/* Simulador Interativo */}
            <div className="mt-16 bg-white rounded-3xl border border-rp-cinza-borda shadow-xl overflow-hidden max-w-4xl mx-auto relative z-10">
              <div className="grid md:grid-cols-2">
                {/* Controles */}
                <div className="p-8 bg-rp-cinza-claro/50 border-r border-rp-cinza-borda">
                  <h4 className="text-lg font-bold text-rp-texto mb-2">Simulador de Faturamento</h4>
                  <p className="text-xs text-rp-cinza-medio mb-6">
                    Arraste o controle para simular o investimento exato com base no número de colaboradores da sua empresa.
                  </p>

                  {/* Slider de Headcount */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-rp-texto">Número de Colaboradores</span>
                      <span className="text-lg font-bold text-rp-azul bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {colaboradores} {colaboradores === 1000 ? '+' : ''}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={colaboradores}
                      onChange={(e) => setColaboradores(parseInt(e.target.value))}
                      className="w-full h-2 bg-rp-cinza-borda rounded-lg appearance-none cursor-pointer accent-rp-laranja"
                    />
                    <div className="flex justify-between text-[10px] text-rp-cinza-medio mt-1">
                      <span>10 colab.</span>
                      <span>500 colab.</span>
                      <span>1.000+ colab.</span>
                    </div>
                  </div>

                  {/* Serviços Selecionados */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-rp-cinza-medio block mb-2">
                      Escolha seus serviços:
                    </span>

                    {/* Diagnóstico NR-1 */}
                    <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-rp-cinza-borda hover:border-rp-azul/45 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incluirDiagnostico}
                        onChange={(e) => setIncluirDiagnostico(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-rp-azul focus:ring-rp-azul"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-rp-texto">Diagnóstico NR-1 (Flagship)</span>
                          <span className="text-[9px] font-bold bg-orange-50 text-rp-laranja px-2 py-0.5 rounded">Cobrança Única</span>
                        </div>
                        <p className="text-[10px] text-rp-cinza-medio">R$ 30 por colaborador / aplicação</p>
                      </div>
                    </label>

                    {/* Plano de Ação */}
                    <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-rp-cinza-borda hover:border-rp-azul/45 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incluirPlano}
                        onChange={(e) => setIncluirPlano(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-rp-azul focus:ring-rp-azul"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-rp-texto">Plano de Ação Continuado</span>
                          <span className="text-[9px] font-bold bg-blue-50 text-rp-azul px-2 py-0.5 rounded">Mensal</span>
                        </div>
                        <p className="text-[10px] text-rp-cinza-medio">R$ 10 por colaborador / mês</p>
                      </div>
                    </label>

                    {/* Canal de Escuta */}
                    <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-rp-cinza-borda hover:border-rp-azul/45 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incluirEscuta}
                        onChange={(e) => setIncluirEscuta(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-rp-azul focus:ring-rp-azul"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-rp-texto">Canal de Escuta Profissional</span>
                          <span className="text-[9px] font-bold bg-blue-50 text-rp-azul px-2 py-0.5 rounded">Mensal</span>
                        </div>
                        <p className="text-[10px] text-rp-cinza-medio">R$ 5 por colaborador / mês (Lançamento 2026)</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Resultado do Faturamento Asaas */}
                <div className="p-8 flex flex-col justify-between" style={{ backgroundColor: '#002244' }}>
                  <div className="text-white">
                    <span className="inline-block px-2.5 py-1 bg-white/10 text-rp-laranja text-[10px] font-bold rounded-full mb-6 uppercase tracking-wider">
                      Consolidação Inteligente Asaas
                    </span>

                    {/* Cobrança Única */}
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-white/70">Faturamento Único (Pontual)</span>
                        <span className="text-[9px] font-bold bg-rp-laranja text-white px-2 py-0.5 rounded-full uppercase">Aplicação</span>
                      </div>
                      <p className="text-3xl font-extrabold text-white">
                        R$ {totalUnico.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-[10px] text-white/50 mt-1">
                        Emitido em uma única cobrança consolidada na contratação de cada aplicação do Diagnóstico.
                      </p>
                    </div>

                    {/* Assinatura Recorrente */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-white/70">Assinatura Mensal Unificada</span>
                        <span className="text-[9px] font-bold bg-rp-azul text-white px-2 py-0.5 rounded-full uppercase">Recorrente</span>
                      </div>
                      <p className="text-3xl font-extrabold text-white">
                        R$ {totalMensal.toLocaleString('pt-BR')}
                        <span className="text-sm font-normal text-white/60"> /mês</span>
                      </p>
                      <p className="text-[10px] text-white/50 mt-1">
                        Soma de todos os seus serviços mensais. O Asaas gerencia uma única cobrança recorrente no dia do faturamento.
                      </p>
                    </div>
                  </div>

                  {/* Explicativo das duas faturas */}
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex gap-2.5 items-start bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white/80">
                      <Check size={16} className="text-rp-laranja flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block mb-0.5">Regra das Duas Cobranças</strong>
                        O cliente de serviços pontuais e recorrentes recebe exatamente **2 faturas organizadas**: um boleto pontual consolidado e uma fatura de assinatura mensal unificada.
                      </div>
                    </div>
                    <a
                      href="#contato"
                      className="block w-full text-center bg-rp-laranja hover:bg-rp-laranja/90 text-white text-sm font-bold py-3.5 rounded-xl mt-4 transition-all shadow-lg"
                    >
                      Solicitar Proposta Customizada →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Comparativo ────────────────────────────────────────────── */}
      <section id="comparativo" className="py-20 bg-rp-cinza-claro">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 bg-orange-50 text-rp-laranja text-xs font-bold rounded-full mb-4 uppercase tracking-wide">
              Comparativo
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-3">
              Consultoria tradicional <span className="text-rp-laranja">× SinalRH</span>.
            </h2>
            <p className="text-xs text-rp-cinza-medio max-w-2xl mx-auto">
              O que muda quando a consultoria vem acompanhada de uma plataforma estruturada
              para coletar, organizar e auditar o ciclo PGR.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead style={{ background: '#002244' }} className="text-white">
                <tr>
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wide">Capacidade</th>
                  <th className="text-center px-3 py-4">
                    <p className="text-rp-laranja font-bold">SinalRH</p>
                    <p className="text-[10px] font-normal text-white/50">consultoria + plataforma</p>
                  </th>
                  <th className="text-center px-3 py-4">
                    <p className="text-white/80 font-semibold">Consultoria tradicional</p>
                    <p className="text-[10px] font-normal text-white/40">só consultoria</p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIVO.map((grupo) => (
                  <>
                    <tr key={`cat-${grupo.categoria}`} className="bg-rp-cinza-claro/60">
                      <td colSpan={3} className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-rp-cinza-medio">
                        {grupo.categoria}
                      </td>
                    </tr>
                    {grupo.itens.map((linha, i) => (
                      <tr key={`${grupo.categoria}-${i}`} className="border-t border-rp-cinza-borda/60">
                        <td className="px-5 py-3 text-rp-texto">{linha[0]}</td>
                        <td className="text-center py-3 bg-orange-50/40"><Cell valor={linha[1]} /></td>
                        <td className="text-center py-3"><Cell valor={linha[2]} /></td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[1fr_2fr] gap-12">
          <div>
            <span className="inline-block px-3 py-1 bg-orange-50 text-rp-laranja text-xs font-bold rounded-full mb-4 uppercase tracking-wide">
              Dúvidas frequentes
            </span>
            <h2 className="text-4xl font-bold leading-tight">
              Respostas que diretores costumam querer. <span className="text-rp-laranja">conhecidas.</span>
            </h2>
            <p className="text-sm text-rp-cinza-medio mt-4">
              Não achou o que procurava? <a href="#contato" className="text-rp-azul font-bold underline">Fale com a gente</a>,
              geralmente respondemos em menos de 4 horas úteis.
            </p>
          </div>
          <div className="space-y-1">
            {FAQ.map((item, i) => (
              <div key={i} className="border-b border-rp-cinza-borda">
                <button
                  onClick={() => setFaqAberto(faqAberto === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left"
                >
                  <span className="text-base font-semibold text-rp-texto">{item.q}</span>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${faqAberto === i ? 'bg-rp-laranja text-white' : 'bg-blue-50 text-rp-azul'}`}>
                    {faqAberto === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>
                {faqAberto === i && (
                  <p className="text-sm text-rp-cinza-medio pb-5 leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────────────── */}
      <section id="contato" className="py-20" style={{ background: '#002244' }}>
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl lg:text-5xl font-bold mb-5 leading-tight">
            Pronto para <span className="text-rp-laranja">acender o sinal</span>?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Comece pelo Diagnóstico Psicossocial NR-1. Reunião de alinhamento sem
            custo, proposta personalizada e aplicação em até 30 dias.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:contato@saralinhar.com.br?subject=Solicitação%20de%20Diagnóstico%20NR-1"
              className="bg-rp-laranja text-white px-7 py-3 rounded-xl font-bold hover:bg-rp-laranja/90 transition-colors inline-flex items-center gap-2"
            >
              Solicitar diagnóstico <ArrowRight size={16} />
            </a>
            <a
              href="mailto:contato@saralinhar.com.br?subject=Agendar%20conversa%20sobre%20SinalRH"
              className="border-2 border-white/30 text-white px-7 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors"
            >
              Agendar conversa
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-rp-cinza-borda py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-6">
          <div>
            <img src="/assets/imagens/logo_horizontal.png" alt="SinalRH" className="h-7" />
            <p className="text-[11px] text-rp-cinza-medio mt-2">
              © {new Date().getFullYear()} SinalRH · Uma iniciativa Sara Linhar Consultoria
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-xs text-rp-cinza-medio">
            <a href="#produto" className="hover:text-rp-azul">Como funciona</a>
            <a href="#recursos" className="hover:text-rp-azul">Recursos</a>
            <a href="#precos" className="hover:text-rp-azul">Produtos</a>
            <a href="#seguranca" className="hover:text-rp-azul">Segurança</a>
            <Link to="/admin/login" className="hover:text-rp-azul">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
