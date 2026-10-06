/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0a0f',
          50: '#16161f',
          100: '#1a1a25',
          200: '#1e1e2a',
          300: '#25253a',
          400: '#2a2a40',
          border: 'rgba(255,255,255,0.06)',
          'border-hover': 'rgba(255,255,255,0.12)',
        },
        accent: {
          cyan: '#06b6d4',
          'cyan-dim': 'rgba(6,182,212,0.15)',
          'cyan-glow': 'rgba(6,182,212,0.3)',
          emerald: '#10b981',
          'emerald-dim': 'rgba(16,185,129,0.12)',
          amber: '#f59e0b',
          'amber-dim': 'rgba(245,158,11,0.12)',
          red: '#ef4444',
          'red-dim': 'rgba(239,68,68,0.1)',
        },
        text: {
          primary: '#f0f0f5',
          secondary: '#8b8b9e',
          tertiary: '#55556a',
          muted: '#44445a',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'grid-flow': 'gridFlow 20s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        gridFlow: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        'radial-glow': 'radial-gradient(ellipse at center, rgba(6,182,212,0.08) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '60px 60px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        'glass-hover': '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.15), 0 0 60px rgba(6,182,212,0.05)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.15), 0 0 60px rgba(16,185,129,0.05)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.15), 0 0 60px rgba(245,158,11,0.05)',
        'glow-red': '0 0 20px rgba(239,68,68,0.15), 0 0 60px rgba(239,68,68,0.05)',
      },
    },
  },
  plugins: [],
};