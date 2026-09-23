import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    colors: { ink: '#14243D', muted: '#64748B', outline: '#DFE5ED', brand: '#2465E8', canvas: '#F7F9FC' },
    boxShadow: { soft: '0 8px 36px rgba(24, 42, 69, 0.045)' }
  } },
  plugins: []
};
export default config;
