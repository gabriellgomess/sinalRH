import { useState } from 'react'
import { Check, Award, XCircle, CheckCircle2 } from 'lucide-react'

/**
 * Executa um teste: renderiza perguntas, coleta respostas e submete.
 * props:
 *  - teste: { titulo, descricao, nota_minima }
 *  - perguntas: [{ id, enunciado, tipo, opcoes[] }]
 *  - onSubmit: (respostas) => Promise<{ nota, aprovado, acertos, total, nota_minima, simulado? }>
 *  - modoVisualizacao: bool (rótulo diferente; back-end não persiste)
 */
export function TesteRunner({ teste, perguntas, onSubmit, modoVisualizacao = false }) {
  const [respostas, setRespostas] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  function marcar(perguntaId, idx, tipo) {
    setRespostas((r) => {
      const atual = new Set(r[perguntaId] || [])
      if (tipo === 'verdadeiro_falso') return { ...r, [perguntaId]: [idx] }
      if (atual.has(idx)) atual.delete(idx); else atual.add(idx)
      return { ...r, [perguntaId]: Array.from(atual) }
    })
  }

  async function enviar() {
    setEnviando(true)
    try {
      const res = await onSubmit(respostas)
      setResultado(res)
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível enviar o teste.')
    } finally {
      setEnviando(false)
    }
  }

  if (resultado) {
    const ok = resultado.aprovado
    return (
      <div className="text-center py-6">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${ok ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {ok ? <Award size={30} /> : <XCircle size={30} />}
        </div>
        <p className="text-2xl font-bold text-rp-texto">{resultado.nota}%</p>
        <p className={`text-sm font-semibold ${ok ? 'text-green-600' : 'text-red-600'}`}>{ok ? 'Aprovado' : 'Não aprovado'}</p>
        <p className="text-xs text-rp-cinza-medio mt-1">
          {resultado.acertos} de {resultado.total} · nota mínima {resultado.nota_minima}%
        </p>
        {(resultado.simulado || modoVisualizacao) && (
          <p className="mt-3 text-xs text-rp-cinza-medio bg-rp-cinza-claro inline-block px-3 py-1.5 rounded-full">
            Simulação — nenhum resultado foi registrado.
          </p>
        )}
      </div>
    )
  }

  const total = perguntas.length
  const respondidas = Object.values(respostas).filter((a) => a && a.length > 0).length

  return (
    <div className="space-y-5">
      {modoVisualizacao && (
        <div className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          Modo visualização — suas respostas não são registradas.
        </div>
      )}

      {perguntas.map((p, i) => (
        <div key={p.id} className="bg-white rounded-xl shadow-card p-4">
          <p className="text-sm font-medium text-rp-texto mb-3">
            <span className="text-rp-cinza-medio mr-1">{i + 1}.</span>{p.enunciado}
          </p>
          <div className="space-y-2">
            {(p.opcoes ?? []).map((o, idx) => {
              const marcada = (respostas[p.id] || []).includes(idx)
              return (
                <button
                  key={idx}
                  onClick={() => marcar(p.id, idx, p.tipo)}
                  className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${marcada ? 'border-rp-azul bg-rp-azul-suave text-rp-azul font-medium' : 'border-rp-cinza-borda text-rp-texto hover:border-rp-azul/40'}`}
                >
                  <span className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border ${marcada ? 'bg-rp-azul border-rp-azul text-white' : 'border-rp-cinza-borda'}`}>
                    {marcada && <Check size={12} />}
                  </span>
                  {o}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between sticky bottom-0 bg-rp-cinza-claro py-3">
        <span className="text-xs text-rp-cinza-medio">{respondidas}/{total} respondidas</span>
        <button
          onClick={enviar}
          disabled={enviando || respondidas < total}
          className="inline-flex items-center gap-2 bg-rp-laranja text-white font-semibold rounded-lg px-5 py-2.5 text-sm disabled:opacity-50"
        >
          <CheckCircle2 size={16} /> {enviando ? 'Enviando...' : (modoVisualizacao ? 'Simular' : 'Enviar respostas')}
        </button>
      </div>
    </div>
  )
}
