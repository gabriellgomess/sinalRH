export const unidades = [
  {
    id: 1,
    nome: 'Unidade São Paulo',
    pessoas: 268,
    setores: [
      { id: 1, nome: 'Atendimento · noturno', responsavel: 'Renato A.', iniciais: 'RA', pessoas: 42, risco: 'critico', score: 54 },
      { id: 2, nome: 'Atendimento · diurno', responsavel: 'Renato A.', iniciais: 'RA', pessoas: 38, risco: 'baixo', score: 78 },
      { id: 3, nome: 'Operações Logística', responsavel: 'Júlia M.', iniciais: 'JM', pessoas: 68, risco: 'alto', score: 62 },
      { id: 4, nome: 'Suporte técnico', responsavel: 'Bruno C.', iniciais: 'BC', pessoas: 30, risco: 'moderado', score: 71 }
    ]
  },
  {
    id: 2,
    nome: 'Unidade Recife',
    pessoas: 88,
    setores: [
      { id: 5, nome: 'Marketing', responsavel: 'Helena T.', iniciais: 'HT', pessoas: 18, risco: 'baixo', score: 74 },
      { id: 6, nome: 'Pesquisa & Dev', responsavel: 'Pedro N.', iniciais: 'PN', pessoas: 32, risco: 'baixo', score: 88 }
    ]
  },
  {
    id: 3,
    nome: 'Unidade Curitiba',
    pessoas: 56,
    setores: [
      { id: 7, nome: 'Financeiro', responsavel: 'Ana C.', iniciais: 'AC', pessoas: 16, risco: 'baixo', score: 78 },
      { id: 8, nome: 'Comercial', responsavel: 'Felipe S.', iniciais: 'FS', pessoas: 24, risco: 'baixo', score: 82 }
    ]
  }
]

export const setoresList = unidades.flatMap((u) =>
  u.setores.map((s) => ({ ...s, unidade: u.nome }))
)
