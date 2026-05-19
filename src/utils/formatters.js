export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', ...options })
}

export function formatDateLong(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatPercent(value) {
  return `${Math.round(value)}%`
}

export function formatScore(value, max = 100) {
  return `${value}/${max}`
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export function getRiskColor(nivel) {
  const map = {
    critico:   { bg: '#fdf0f0', text: '#c0392b', label: 'CRÍTICO' },
    alto:      { bg: '#fef5ec', text: '#d35400', label: 'ALTO' },
    moderado:  { bg: '#fef9e7', text: '#b7950b', label: 'MODERADO' },
    baixo:     { bg: '#e8f8f0', text: '#1e8449', label: 'BAIXO' },
    sem_dados: { bg: '#f2f3f4', text: '#95a5a6', label: 'S/ DADOS' }
  }
  return map[nivel] || { bg: '#f2f3f4', text: '#95a5a6', label: '—' }
}

export function getRiskBarColor(nivel) {
  const map = {
    critico: '#d9534f',
    alto: '#e67e22',
    moderado: '#f2c94c',
    baixo: '#27ae60'
  }
  return map[nivel] || '#27ae60'
}

export function getScoreBarColor(score) {
  if (score >= 80) return '#27ae60'
  if (score >= 65) return '#003366'
  if (score >= 50) return '#f2c94c'
  return '#d9534f'
}

export function relativeTime(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffMin < 60) return `há ${diffMin} min`
  if (diffH < 24) return `há ${diffH}h`
  return `há ${diffD} dias`
}
