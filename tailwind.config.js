/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rp: {
          azul: '#003366',
          'azul-deep': '#002244',
          'azul-suave': '#e6f0fa',
          laranja: '#e67e22',
          'laranja-claro': '#f39c12',
          'cinza-claro': '#f0f0f0',
          'cinza-borda': '#e2e6ec',
          'cinza-medio': '#666666',
          texto: '#1f2a37',
          alerta: '#f2c94c',
          critico: '#d9534f',
          sucesso: '#27ae60',
          'sucesso-claro': '#e8f8f0',
          'alerta-claro': '#fef9e7',
          'critico-claro': '#fdf0f0',
        }
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'display': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'h2': ['18px', { lineHeight: '1.4', fontWeight: '700' }],
        'h3': ['15px', { lineHeight: '1.5', fontWeight: '600' }],
        'body': ['13px', { lineHeight: '1.6', fontWeight: '500' }],
        'label': ['11px', { lineHeight: '1.4', fontWeight: '600' }],
        'number': ['28px', { lineHeight: '1', fontWeight: '700' }],
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(15,30,60,0.04), 0 2px 12px rgba(15,30,60,0.05)',
        'card-hover': '0 4px 20px rgba(15,30,60,0.10)',
        'sidebar': '2px 0 16px rgba(0,51,102,0.08)',
      },
      spacing: {
        '18': '72px',
        '22': '88px',
      }
    }
  },
  plugins: []
}
