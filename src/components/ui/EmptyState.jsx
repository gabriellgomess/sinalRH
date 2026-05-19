export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-rp-cinza-borda">{icon}</div>}
      <h3 className="text-base font-semibold text-rp-texto mb-1">{title}</h3>
      {description && <p className="text-sm text-rp-cinza-medio max-w-xs mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
