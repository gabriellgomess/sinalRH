export const riscosPsicossociais = [
  {
    id: 1,
    setor: 'Atendimento · noturno',
    pessoas: 42,
    nivel: 'critico',
    score: 54,
    dimensoes: {
      Demanda: 92,
      Liderança: 48,
      Clareza: 55,
      Autonomia: 40,
      Reconhecimento: 38,
      Comunicação: 52,
      Conflitos: 78,
      Iitos: 65
    },
    recomendacao: {
      titulo: 'Revisar escala do turno noturno e introduzir pausas estruturadas',
      descricao: 'A combinação demanda alta + baixo reconhecimento aparece nas últimas 3 medições. Sugerimos: 1) rever distribuição de chamados; 2) ritual semanal de feedback; 3) plano de carreira para analistas pleno.',
      categoria: 'RECOMENDAÇÃO · CONSULTORIA'
    }
  },
  {
    id: 2,
    setor: 'Operações Logística',
    pessoas: 68,
    nivel: 'alto',
    score: 62,
    dimensoes: {
      Demanda: 78,
      Liderança: 62,
      Clareza: 60,
      Autonomia: 55,
      Reconhecimento: 50,
      Comunicação: 58,
      Conflitos: 45,
      Iitos: 52
    },
    recomendacao: {
      titulo: 'Implementar ritual semanal de feedback entre liderança e times de campo',
      descricao: 'A percepção de comunicação caiu 12 pontos. Recomendamos reuniões semanais curtas (15min) de alinhamento com cada equipe.',
      categoria: 'RECOMENDAÇÃO · CONSULTORIA'
    }
  },
  {
    id: 3,
    setor: 'Suporte técnico',
    pessoas: 30,
    nivel: 'moderado',
    score: 71,
    dimensoes: {
      Demanda: 65,
      Liderança: 72,
      Clareza: 70,
      Autonomia: 68,
      Reconhecimento: 62,
      Comunicação: 74,
      Conflitos: 40,
      Iitos: 58
    },
    recomendacao: null
  },
  {
    id: 4,
    setor: 'Vendas · interno',
    pessoas: 24,
    nivel: 'moderado',
    score: 68,
    dimensoes: {
      Demanda: 70,
      Liderança: 65,
      Clareza: 72,
      Autonomia: 60,
      Reconhecimento: 58,
      Comunicação: 68,
      Conflitos: 42,
      Iitos: 55
    },
    recomendacao: null
  },
  {
    id: 5,
    setor: 'Marketing',
    pessoas: 18,
    nivel: 'baixo',
    score: 74,
    dimensoes: {
      Demanda: 55,
      Liderança: 80,
      Clareza: 75,
      Autonomia: 78,
      Reconhecimento: 72,
      Comunicação: 80,
      Conflitos: 30,
      Iitos: 45
    },
    recomendacao: null
  },
  {
    id: 6,
    setor: 'Financeiro',
    pessoas: 16,
    nivel: 'baixo',
    score: 78,
    dimensoes: {
      Demanda: 50,
      Liderança: 82,
      Clareza: 80,
      Autonomia: 75,
      Reconhecimento: 76,
      Comunicação: 82,
      Conflitos: 28,
      Iitos: 40
    },
    recomendacao: null
  }
]

export const dimensoesLabels = [
  'Demanda', 'Liderança', 'Clareza', 'Autonomia',
  'Reconhecimento', 'Comunicação', 'Conflitos', 'Iitos'
]
