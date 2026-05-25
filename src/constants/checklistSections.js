export const CHECKLIST_SECTIONS = [
  {
    id: 1,
    title: 'Demandas de Trabalho',
    items: [
      'Tenho tempo suficiente para realizar minhas atividades com qualidade.',
      'A quantidade de trabalho que recebo é adequada à minha função.',
      'Os prazos concedidos são realistas e não geram pressão excessiva.',
      'Minhas atividades exigem um nível de concentração que consigo manter ao longo da jornada.',
    ],
  },
  {
    id: 2,
    title: 'Controle e Autonomia',
    items: [
      'Tenho autonomia para organizar a forma como executo meu trabalho.',
      'Posso participar de decisões que impactam minhas atividades.',
      'Tenho controle sobre o ritmo e a priorização do meu trabalho.',
      'Consigo organizar pausas quando necessário durante o trabalho.',
    ],
  },
  {
    id: 3,
    title: 'Clareza de Papel e Expectativas',
    items: [
      'Tenho clareza sobre minhas responsabilidades no trabalho.',
      'Recebo orientações claras sobre o que é esperado de mim.',
      'Consigo realizar minhas atividades sem dúvidas frequentes.',
      'As metas e objetivos do meu trabalho são bem definidos.',
    ],
  },
  {
    id: 4,
    title: 'Relacionamentos e Justiça Organizacional',
    items: [
      'O ambiente de trabalho é respeitoso.',
      'Sinto que sou tratado(a) com justiça na organização.',
      'Existe confiança entre equipe e liderança.',
      'Não vivencio situações de desrespeito ou constrangimento no trabalho.',
    ],
  },
  {
    id: 5,
    title: 'Reconhecimento e Recompensa',
    items: [
      'Meu trabalho é reconhecido pela liderança.',
      'Recebo feedbacks sobre meu desempenho.',
      'Minha remuneração é adequada às minhas responsabilidades.',
      'Sinto que meus esforços são valorizados pela empresa.',
    ],
  },
  {
    id: 6,
    title: 'Suporte e Segurança Psicológica',
    items: [
      'Sinto-me seguro(a) para expressar opiniões no trabalho.',
      'Recebo apoio da liderança quando enfrento dificuldades.',
      'Posso falar sem medo de consequências negativas.',
      'Sinto que a empresa se preocupa com meu bem-estar.',
    ],
  },
  {
    id: 7,
    title: 'Condições Organizacionais e Comunicação',
    items: [
      'Tenho acesso aos recursos necessários para realizar meu trabalho.',
      'A comunicação na empresa é clara e eficiente.',
      'As informações chegam até mim de forma adequada.',
      'Consigo realizar minhas atividades sem interrupções constantes.',
    ],
  },
  {
    id: 8,
    title: 'Gestão de Mudanças',
    items: [
      'As mudanças na empresa são comunicadas com clareza.',
      'Sinto-me preparado(a) para lidar com mudanças no trabalho.',
      'Recebo suporte quando ocorrem mudanças que impactam minha rotina.',
      'Entendo os motivos das mudanças na empresa.',
    ],
  },
  {
    id: 9,
    title: 'Segurança e Situações Críticas',
    items: [
      'Sinto-me seguro(a) no ambiente de trabalho.',
      'A empresa atua para prevenir situações de risco ou violência.',
      'Existem orientações claras para situações de emergência.',
      'Confio na forma como a empresa lida com situações críticas.',
    ],
  },
  {
    id: 10,
    title: 'Integração e Trabalho Remoto',
    items: [
      'Sinto-me integrado(a) à equipe.',
      'Consigo manter uma boa comunicação com minha equipe.',
      'Sinto-me apoiado(a) pela equipe.',
      'Tenho acesso às informações necessárias no trabalho remoto.',
    ],
  },
]

export const TOTAL_ITENS = CHECKLIST_SECTIONS.reduce((sum, s) => sum + s.items.length, 0)

export const SEXO_OPTIONS = [
  { value: 'masculino',     label: 'Masculino' },
  { value: 'feminino',      label: 'Feminino' },
  { value: 'nao_informado', label: 'Prefiro não informar' },
]

export const FAIXA_ETARIA_OPTIONS = [
  { value: '18_24',   label: '18 a 24 anos' },
  { value: '25_34',   label: '25 a 34 anos' },
  { value: '35_44',   label: '35 a 44 anos' },
  { value: '45_54',   label: '45 a 54 anos' },
  { value: '55_mais', label: '55 anos ou mais' },
]
