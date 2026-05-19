export function RadarLogo({ size = 'md', dark = false }) {
  const sizes = {
    sm: { icon: 24, text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 32, text: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 40, text: 'text-2xl', sub: 'text-xs' }
  }
  const s = sizes[size]

  return (
    <div className="flex items-center gap-2.5">
      <svg width={s.icon} height={s.icon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="13.5" stroke={dark ? '#e2e6ec' : '#003366'} strokeWidth="1.5" strokeDasharray="7 5" opacity="0.4" />
        <circle cx="20" cy="20" r="9" stroke={dark ? '#e2e6ec' : '#003366'} strokeWidth="1.5" opacity="0.6" />
        <circle cx="20" cy="20" r="4.5" stroke={dark ? '#ffffff' : '#003366'} strokeWidth="2" />
        <circle cx="20" cy="20" r="2" fill="#e67e22" />
        <circle cx="12" cy="16.5" r="1.8" fill={dark ? '#e2e6ec' : '#003366'} opacity="0.75" />
        <circle cx="27.5" cy="24" r="1.8" fill={dark ? '#e2e6ec' : '#003366'} opacity="0.75" />
        <circle cx="25" cy="12.5" r="1.5" fill="#e67e22" opacity="0.9" />
      </svg>
      <div>
        <div className={`${s.text} font-bold leading-none`}>
          <span className={dark ? 'text-white' : 'text-rp-azul'}>Radar</span>
          <span className="text-rp-laranja">Pessoas</span>
        </div>
        <div className={`${s.sub} font-semibold tracking-widest mt-0.5 ${dark ? 'text-white/60' : 'text-rp-cinza-medio'} uppercase`}>
          by Sara Linhar Consultoria
        </div>
      </div>
    </div>
  )
}
