import React from 'react'
import { Sparkles, Calendar, Settings, ArrowRight, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export default function EmBreve({ modulo }) {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-[75vh] flex items-center justify-center p-4 overflow-hidden">
      {/* Background Decorative Blurs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-rp-azul/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-rp-laranja/10 blur-[120px] pointer-events-none" />

      {/* Glassmorphic Container */}
      <div className="relative max-w-2xl w-full bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-8 md:p-12 shadow-2xl text-center flex flex-col items-center">
        
        {/* Premium Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rp-azul to-rp-azul-suave flex items-center justify-center mb-6 shadow-lg shadow-rp-azul/20 animate-pulse">
          <Sparkles className="text-white" size={28} strokeWidth={1.8} />
        </div>

        {/* Brand Subtitle */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-rp-laranja text-xs font-bold uppercase tracking-wider mb-4 border border-orange-100">
          <ShieldCheck size={12} />
          Módulo Contratado
        </div>

        {/* Dynamic Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-rp-azul tracking-tight mb-4">
          Prepare-se para o <span className="bg-gradient-to-r from-rp-azul to-rp-laranja bg-clip-text text-transparent">{modulo}</span>
        </h1>

        {/* Elegant Copy */}
        <p className="text-rp-texto text-base md:text-lg leading-relaxed max-w-lg mb-8 opacity-90">
          Temos ótimas notícias! Sua empresa já contratou este produto. A equipe de consultores da <strong>Sara Linhar Consultoria</strong> já está estruturando a metodologia, os questionários e os benchmarks customizados para o seu negócio.
        </p>

        {/* Setup Flow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8 text-left">
          {[
            { icon: ShieldCheck, title: 'Ativação', desc: 'Contrato ativo e provisionado na base Sinal RH.' },
            { icon: Settings, title: 'Configuração', desc: 'Consultoria preparando as competências e perfis.' },
            { icon: Calendar, title: 'Lançamento', desc: 'Sua equipe será notificada do início em breve!' }
          ].map((step, idx) => (
            <div key={idx} className="bg-white/50 border border-white/60 rounded-2xl p-4 shadow-sm hover:border-rp-azul/20 transition-all">
              <div className="w-8 h-8 rounded-lg bg-rp-azul-suave/30 flex items-center justify-center mb-3">
                <step.icon size={15} className="text-rp-azul" />
              </div>
              <h3 className="text-sm font-bold text-rp-azul mb-1">{step.title}</h3>
              <p className="text-xs text-rp-cinza-medio leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="primary" onClick={() => navigate('/admin/dashboard')}>
            Voltar para o Dashboard <ArrowRight size={14} className="inline ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
