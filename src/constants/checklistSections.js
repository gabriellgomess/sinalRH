export const CHECKLIST_SECTIONS = [
  {
    id: 1,
    title: 'Demandas do Trabalho',
    items: [
      'Tenho tempo adequado disponível para realizar minhas atividades',
      'O meu trabalho exige muita pressão para solucionar o ritmo de trabalho demais',
      'Fico muito pressionado para terminar uma tarefa com prioridade',
      'O nível de exigência para manter minhas atividades com tranquilidade',
      'Existe pressão para a resolução da interferência e finalização das atividades',
      'O ritmo de trabalho é saudável sem me causar ameaças frequentes durante os turnos',
      'Situações excessivas me preocupam com as tarefas não finalizadas',
    ],
  },
  {
    id: 2,
    title: 'Autonomia e Controle',
    items: [
      'Tenho autonomia para executar o meu trabalho',
      'Me sinto seguro para sugerir melhorias nos processos do trabalho',
      'Consigo desfrutar da minha vida pessoal fora do trabalho',
      'Sinto que utilizo todo o meu tempo disponível e constantemente me controlo no trabalho',
      'Reconhecimento sobre a minha vida pessoal e sou prejudicado pelo trabalho',
    ],
  },
  {
    id: 3,
    title: 'Clareza de Papel e Expectativas',
    items: [
      'Tenho clareza sobre o que é esperado do meu comportamento e da minha performance no trabalho',
      'Sinto liberdade para tirar dúvidas e para solucionar o que é exigido do meu papel no trabalho',
      'Frequentemente sigo que os direcionamentos dos líderes são satisfatórios',
      'Consigo compreender e solucionar ou fazer tranquilamente as atividades sem falta de clareza nas expectativas',
    ],
  },
  {
    id: 4,
    title: 'Relacionamentos no Ambiente de Trabalho',
    items: [
      'Eu sinto que minha equipe tem boas relações no ambiente de trabalho',
      'Consigo manter uma relação de respeito e de boa vontade com os colegas',
      'Não vivencio ou presencio assédio moral, humilhação ou discriminação no trabalho',
      'Tenho conhecimento sobre o Código de Conduta da organização',
      'Já presenciei uma situação de assédio moral ou sexual no trabalho',
    ],
  },
  {
    id: 5,
    title: 'Reconhecimento e Reforço Positivo',
    items: [
      'Sou frequentemente reconhecido por minhas competências dentro da minha área',
      'Tenho um elogio público sempre que a empresa, os líderes e outros colaboradores me incentivam',
      'Tenho uma rotina de feedback com a minha liderança',
      'Fico satisfeito com a remuneração e os benefícios que recebo pelo meu trabalho',
      'Não acho justo a política de reconhecimento e o reforço positivo da organização',
    ],
  },
  {
    id: 6,
    title: 'Segurança Psicológica',
    items: [
      'Me sinto livre para expressar dúvidas, dificuldades e discordâncias no trabalho',
      'A empresa oferece treinamentos sobre saúde mental',
      'Sinto liberdade de tolerância para falar sobre emoção e sentimento',
      'Fui ignorado pela liderança quando tentei expressar problemas',
    ],
  },
  {
    id: 7,
    title: 'Condições Organizacionais',
    items: [
      'Me sinto satisfeito com as condições físicas do trabalho',
      'Tenho acesso a todas as ferramentas e recursos necessários',
      'O ambiente de trabalho é saudável e agradável',
      'Me sinto reconhecido com o espaço disponível para o trabalho',
      'Tenho liberdade para discutir sobre a liderança sobre as condições do trabalho',
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
