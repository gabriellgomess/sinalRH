export function Input({ label, id, error, hint, leftIcon, rightIcon, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-rp-texto mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-cinza-medio">{leftIcon}</span>
        )}
        <input
          id={id}
          className={`input-field ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${error ? 'border-rp-critico focus:ring-rp-critico' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-rp-cinza-medio">{rightIcon}</span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rp-critico">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-rp-cinza-medio">{hint}</p>}
    </div>
  )
}
