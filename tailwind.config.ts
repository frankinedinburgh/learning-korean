import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0f',
        surface: '#16161a',
        surface2: '#1e1e24',
        border: '#2a2a35',
        accent: '#e8c547',
        accent2: '#7c6af7',
        accent3: '#4ecdc4',
        muted: '#7a7a8a',
      },
    },
  },
  plugins: [],
}
export default config