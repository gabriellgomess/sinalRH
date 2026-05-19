const variants = {
  ativa: 'bg-green-100 text-green-700',
  encerrada: 'bg-gray-100 text-gray-600',
  rascunho: 'bg-yellow-100 text-yellow-700',
  critico: 'bg-red-100 text-red-700',
  alto: 'bg-orange-100 text-orange-700',
  moderado: 'bg-yellow-100 text-yellow-700',
  baixo: 'bg-green-100 text-green-700',
  atencao: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
  default: 'bg-gray-100 text-gray-600'
}

export function Badge({ label, variant = 'default', className = '' }) {
  const style = variants[variant] || variants.default
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style} ${className}`}>
      {label}
    </span>
  )
}
