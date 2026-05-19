export function Button({ children, variant = 'primary', size = 'md', fullWidth = false, loading = false, disabled = false, onClick, type = 'button', className = '' }) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 gap-2'

  const variants = {
    primary: 'bg-rp-laranja text-white hover:bg-rp-laranja-claro focus:ring-rp-laranja',
    secondary: 'bg-rp-azul text-white hover:bg-rp-azul-deep focus:ring-rp-azul',
    outline: 'border border-rp-cinza-borda bg-white text-rp-texto hover:bg-rp-cinza-claro focus:ring-rp-azul',
    ghost: 'bg-transparent text-rp-azul hover:bg-rp-azul-suave focus:ring-rp-azul',
    danger: 'bg-rp-critico text-white hover:bg-red-700 focus:ring-rp-critico'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs min-h-[32px]',
    md: 'px-5 py-2.5 text-sm min-h-[40px]',
    lg: 'px-6 py-3 text-sm min-h-[50px]',
    xl: 'px-8 py-4 text-base min-h-[56px]'
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
