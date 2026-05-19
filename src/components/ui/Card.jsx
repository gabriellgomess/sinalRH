export function Card({ children, className = '', hover = false, onClick, padding = 'p-5' }) {
  const base = `bg-white rounded-xl ${padding}`
  const shadow = 'shadow-card'
  const hoverStyle = hover ? 'cursor-pointer transition-all duration-150 hover:shadow-card-hover hover:-translate-y-0.5' : ''

  return (
    <div className={`${base} ${shadow} ${hoverStyle} ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}
