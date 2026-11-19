/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#165DFF',
        f2l: '#2563EB',
        oll: '#4F46E5',
        pll: '#9333EA',
        page: '#F5F7FA',
        card: '#FFFFFF',
        'text-primary': '#1D2129',
        'text-secondary': '#4E5969',
        'text-hint': '#86909C',
        border: '#E5E6EB',
        success: '#00B42A',
        warning: '#FF7D00',
        danger: '#F53F3F',
      },
      textColor: {
        'brand': '#165DFF',
        'hint': '#86909C',
        'primary': '#1D2129',
        'secondary': '#4E5969',
        'success': '#00B42A',
        'warning': '#FF7D00',
        'danger': '#F53F3F',
      },
      backgroundColor: {
        'brand': '#165DFF',
        'page': '#F5F7FA',
        'card': '#FFFFFF',
      },
      borderColor: {
        'brand': '#165DFF',
        'default': '#E5E6EB',
      },
      borderRadius: {
        'card': '12px',
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
