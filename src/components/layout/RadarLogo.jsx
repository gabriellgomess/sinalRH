import LogoHorizontal from '../../assets/logo_horizontal.png'
import LogoVertical from '../../assets/logo_verical.png'

export function RadarLogo({ size = 'md', dark = false, vertical = false }) {
  const heights = {
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-20'
  }
  const logo = vertical ? LogoVertical : LogoHorizontal

  return (
    <img 
      src={logo} 
      alt="SinalRH" 
      className={`${heights[size] || 'h-11'} object-contain`}
      style={dark ? { filter: 'brightness(0) invert(1)' } : undefined}
    />
  )
}
