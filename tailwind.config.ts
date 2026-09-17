import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Jewel Cinematic — Light" design system. Channel-triple CSS vars
        // piped through rgb(var(--x) / <alpha-value>) so opacity modifiers
        // (bg-emerald/10, border-ink/20, ...) work. Tailwind key names (ink,
        // border, ...) are kept stable across re-themes — only the
        // underlying CSS variable values change — see globals.css.
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          strong: "rgb(var(--line-strong) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--text) / <alpha-value>)",
          muted: "rgb(var(--text-dim) / <alpha-value>)",
          dim: "rgb(var(--text-faint) / <alpha-value>)",
          "on-emerald": "#FFFFFF",
        },
        emerald: {
          DEFAULT: "rgb(var(--emerald) / <alpha-value>)",
          deep: "rgb(var(--emerald-deep) / <alpha-value>)",
          soft: "var(--emerald-soft)",
        },
        sapphire: "rgb(var(--sapphire) / <alpha-value>)",
        amber: "rgb(var(--amber) / <alpha-value>)",
        gold: "rgb(var(--gold-fill) / <alpha-value>)",
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          soft: "var(--danger-soft)",
          50: "#FBEEEC",
          100: "#F6DBD8",
          200: "#EAB8B2",
          400: "#CB6F65",
          500: "rgb(var(--danger) / <alpha-value>)",
          600: "#93302A",
          700: "#762620",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        arabic: ["var(--font-amiri)", "'Traditional Arabic'", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "fade-up": "fadeUp 0.8s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
