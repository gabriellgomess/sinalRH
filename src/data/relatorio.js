export const relatorio = {
  periodo: '2º Trimestre 2026',
  gerado_em: '2026-05-14T16:00:00',
  empresa: 'Acme Brasil Tecnologia S/A',
  colaboradores: 412,
  setores: 18,
  revisado_em: '2026-05-14',

  resumo_executivo: 'Nos últimos 90 dias o clima organizacional da Acme Brasil subiu de 73 para 76 pontos, com aumento de participação de 8,5 pontos percentuais. O movimento é puxado pelas áreas comerciais e de tecnologia, enquanto Atendimento e Operações Logística mostram piora na percepção de carga de trabalho e reconhecimento.\n\nA análise dos relatos no canal de escuta indica que o turno noturno do Atendimento concentra 5 dos 9 sinais críticos identificados no período. Recomendamos atenção prioritária neste setor.',

  pontos_positivos: [
    'Engajamento em Pesquisa & Dev no maior nível do ano (88/100)',
    'Adesão ao check-in semanal cresce pela 4ª semana seguida',
    'Liderança técnica recebe melhor avaliação dos times'
  ],

  pontos_atencao: [
    'Atendimento noturno: risco crítico mantido por 3 ciclos',
    'Operações Logística: comunicação caiu 12 pontos',
    '3 relatos de sobrecarga aguardando triagem'
  ],

  recomendacoes: [
    'Rever escala do turno noturno de Atendimento antes do próximo ciclo de medição.',
    'Implementar ritual semanal de feedback entre liderança de Operações e times de campo.',
    'Aplicar pulse de reconhecimento focado em analistas pleno até 30 dias.',
    'Iniciar triagem dos relatos pendentes no canal de escuta em até 5 dias úteis.',
    'Considerar programa de mentoria cruzada entre Pesquisa & Dev e Comercial.'
  ],

  plano_acao: [
    { prazo: '20/05/2026', acao: 'Reunião com coord. Atendimento noturno para apresentar dados', responsavel: 'Marina S.' },
    { prazo: '25/05/2026', acao: 'Triagem de relatos do canal de escuta', responsavel: 'Carla M. (SLC)' },
    { prazo: '01/06/2026', acao: 'Início do ritual semanal de feedback em Operações', responsavel: 'Júlia M.' },
    { prazo: '15/06/2026', acao: 'Proposta de nova escala para turno noturno', responsavel: 'RH + Coord.' }
  ],

  distribuicao: {
    diretoria: '3 leituras',
    conselho: 'aguardando',
    lideres_area: 'público'
  }
}
