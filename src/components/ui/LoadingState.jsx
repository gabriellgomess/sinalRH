export function LoadingState({ message = 'Carregando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-rp-cinza-borda border-t-rp-azul rounded-full animate-spin mb-3" />
      <p className="text-sm text-rp-cinza-medio">{message}</p>
    </div>
  )
}
