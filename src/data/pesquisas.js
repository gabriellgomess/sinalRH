export const pesquisas = [
  {
    id: 1,
    titulo: 'Pesquisa de clima · 2º trimestre',
    descricao: 'Avaliação trimestral do clima organizacional em todas as dimensões.',
    tipo: 'Clima',
    status: 'ativa',
    prazo: '2026-05-25',
    respostas: 280,
    total: 412,
    perguntas_total: 20,
    duracao: '~5 min',
    perguntas: [
      { id: 1, dimensao: 'ENGAJAMENTO', texto: 'Sinto orgulho de trabalhar nesta empresa.', tipo: 'likert' },
      { id: 2, dimensao: 'ENGAJAMENTO', texto: 'Recomendaria esta empresa como um bom lugar para trabalhar.', tipo: 'likert' },
      { id: 3, dimensao: 'LIDERANÇA', texto: 'Meu líder demonstra interesse genuíno pelo meu bem-estar.', tipo: 'likert' },
      { id: 4, dimensao: 'LIDERANÇA', texto: 'Recebo feedback claro e construtivo do meu gestor.', tipo: 'likert' },
      { id: 5, dimensao: 'COMUNICAÇÃO', texto: 'As informações importantes chegam a mim de forma clara e oportuna.', tipo: 'likert' },
      { id: 6, dimensao: 'COMUNICAÇÃO', texto: 'Me sinto ouvido quando expresso minhas opiniões.', tipo: 'likert' },
      { id: 7, dimensao: 'CARGA DE TRABALHO', texto: 'Consigo concluir minhas tarefas dentro do horário de trabalho.', tipo: 'likert' },
      { id: 8, dimensao: 'CARGA DE TRABALHO', texto: 'O volume de trabalho que recebo é adequado.', tipo: 'likert' },
      { id: 9, dimensao: 'RECONHECIMENTO', texto: 'Sinto que meu esforço e resultados são reconhecidos.', tipo: 'likert' },
      { id: 10, dimensao: 'RECONHECIMENTO', texto: 'A empresa valoriza o desenvolvimento dos seus colaboradores.', tipo: 'likert' }
    ]
  },
  {
    id: 2,
    titulo: 'Pulse · liderança técnica',
    descricao: 'Avaliação rápida da percepção sobre a liderança técnica.',
    tipo: 'Pulse',
    status: 'ativa',
    prazo: '2026-05-19',
    respostas: 12,
    total: 28,
    perguntas_total: 6,
    duracao: '~2 min',
    perguntas: [
      { id: 1, dimensao: 'LIDERANÇA', texto: 'Minha liderança técnica me apoia quando enfrento desafios.', tipo: 'likert' },
      { id: 2, dimensao: 'LIDERANÇA', texto: 'As decisões técnicas são tomadas de forma transparente.', tipo: 'likert' },
      { id: 3, dimensao: 'DESENVOLVIMENTO', texto: 'Tenho oportunidades claras de crescimento técnico.', tipo: 'likert' }
    ]
  },
  {
    id: 3,
    titulo: 'NPS interno · 1º tri',
    descricao: 'Net Promoter Score interno do primeiro trimestre.',
    tipo: 'NPS',
    status: 'encerrada',
    prazo: '2026-04-30',
    respostas: 375,
    total: 412,
    perguntas_total: 1,
    duracao: '~1 min',
    perguntas: [
      { id: 1, dimensao: 'NPS', texto: 'Em uma escala de 0 a 10, quanto você recomendaria esta empresa como lugar para trabalhar?', tipo: 'nps' }
    ]
  },
  {
    id: 4,
    titulo: 'Saúde mental · turno noturno',
    descricao: 'Avaliação específica de bem-estar e saúde mental para o turno noturno.',
    tipo: 'Risco',
    status: 'encerrada',
    prazo: '2026-04-15',
    respostas: 31,
    total: 42,
    perguntas_total: 14,
    duracao: '~4 min',
    perguntas: []
  },
  {
    id: 5,
    titulo: 'Diagnóstico de liderança',
    descricao: 'Avaliação 360° das lideranças da empresa.',
    tipo: '360°',
    status: 'rascunho',
    prazo: null,
    respostas: 0,
    total: 0,
    perguntas_total: 24,
    duracao: '~8 min',
    perguntas: []
  },
  {
    id: 6,
    titulo: 'Pesquisa de cultura · anual',
    descricao: 'Mapeamento da cultura organizacional e valores vivenciados.',
    tipo: 'Cultura',
    status: 'rascunho',
    prazo: null,
    respostas: 0,
    total: 0,
    perguntas_total: 42,
    duracao: '~12 min',
    perguntas: []
  }
]

export const escalaLikert = [
  { valor: 1, label: 'Discordo totalmente' },
  { valor: 2, label: 'Discordo' },
  { valor: 3, label: 'Neutro' },
  { valor: 4, label: 'Concordo' },
  { valor: 5, label: 'Concordo totalmente' }
]
