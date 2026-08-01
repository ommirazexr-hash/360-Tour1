import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Brand palette - Map Indigo to professional Zinc/Slate-gray neutrals
        indigo: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#18181b', 700: '#27272a', 800: '#3f3f46', 900: '#18181b', 950: '#09090b',
        },
        // Light mode surfaces
        surface: {
          DEFAULT: '#f8fafc',
          50: '#f1f5f9', 100: '#e2e8f0', 200: '#f1f5f9',
          card: '#ffffff', border: '#e2e8f0', muted: '#94a3b8',
        },
        // Text colors
        foreground: { DEFAULT: '#0f172a', muted: '#475569', subtle: '#64748b' },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideInRight: { '0%': { transform: 'translateX(20px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' }, '50%': { boxShadow: '0 0 0 12px rgba(99, 102, 241, 0)' } },
      },
      boxShadow: {
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.2)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
