export function Select({ label, id, options = [], error, placeholder, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-rp-texto mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`input-field appearance-none bg-white ${error ? 'border-rp-critico' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rp-critico">{error}</p>}
    </div>
  )
}
