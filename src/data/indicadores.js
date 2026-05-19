export const indicadores = {
  clima_geral: 76,
  clima_variacao: +3.2,
  participacao: 68,
  participacao_variacao: +8.5,
  risco_psicossocial: 'Moderado',
  risco_variacao: -1,
  setores_atencao: 4,
  setores_atencao_variacao: +1,
  setores_total: 18,
  nps_interno: 42,
  checkins_semana: 89
}

export const evolucaoClima = [
  { mes: 'dez', clima: 69, engajamento: 63 },
  { mes: 'jan', clima: 69, engajamento: 65 },
  { mes: 'fev', clima: 71, engajamento: 67 },
  { mes: 'mar', clima: 73, engajamento: 69 },
  { mes: 'abr', clima: 75, engajamento: 71 },
  { mes: 'mai', clima: 76, engajamento: 74 }
]

export const rankingSetores = [
  { nome: 'Pesquisa & Dev', score: 88 },
  { nome: 'Comercial', score: 82 },
  { nome: 'Financeiro', score: 78 },
  { nome: 'Marketing', score: 74 },
  { nome: 'Operações', score: 62 },
  { nome: 'Atendimento', score: 54 }
]

export const alertas = [
  {
    id: 1,
    titulo: 'Risco crítico em Atendimento · turno noturno',
    descricao: '5 sinais de sobrecarga',
    nivel: 'critico',
    tempo: '2026-05-15T13:00:00'
  },
  {
    id: 2,
    titulo: 'Queda de engajamento em Operações',
    descricao: '-12 pts vs. mês anterior',
    nivel: 'atencao',
    tempo: '2026-05-14T10:00:00'
  },
  {
    id: 3,
    titulo: '3 novos relatos no canal de escuta',
    descricao: 'aguardando triagem',
    nivel: 'info',
    tempo: '2026-05-12T08:00:00'
  }
]

export const insightConsultoria = {
  texto: 'Atendimento apresenta padrão recorrente de sobrecarga aos sábados — recomendamos rever escala antes do próximo ciclo.',
  cta: 'Ver plano de ação'
}
