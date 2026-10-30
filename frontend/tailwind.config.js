/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { colors: { ink: '#101b2d', canvas: '#f5f7fb', brand: '#3157d5', mint: '#dff7ee' }, boxShadow: { soft: '0 12px 36px rgba(16,27,45,.07)' } } },
  plugins: [],
}
