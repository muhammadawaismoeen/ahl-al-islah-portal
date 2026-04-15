import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Islamic-inspired palette
        emerald: {
          deep: "#0a4d3c",
          rich: "#0d6b52",
          mid: "#11876a",
          soft: "#34a583",
        },
        gold: {
          antique: "#b8892b",
          warm: "#d4a845",
          soft: "#e5c16f",
          pale: "#f2dea7",
        },
        cream: {
          DEFAULT: "#faf6ed",
          warm: "#f5ecd7",
          muted: "#ede3c8",
        },
        ink: {
          DEFAULT: "#0f1a17",
          soft: "#1c2a26",
          muted: "#2d3e39",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        arabic: ["var(--font-amiri)", "'Traditional Arabic'", "serif"],
      },
      backgroundImage: {
        "islamic-pattern":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%230a4d3c' stroke-opacity='0.04' stroke-width='1'%3E%3Cpath d='M30 0l30 30-30 30L0 30z'/%3E%3Cpath d='M30 10l20 20-20 20-20-20z'/%3E%3Ccircle cx='30' cy='30' r='8'/%3E%3C/g%3E%3C/svg%3E\")",
        "gold-gradient":
          "linear-gradient(135deg, #b8892b 0%, #d4a845 50%, #e5c16f 100%)",
        "emerald-gradient":
          "linear-gradient(135deg, #0a4d3c 0%, #0d6b52 50%, #11876a 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "fade-up": "fadeUp 0.8s ease-out",
        "shimmer": "shimmer 3s linear infinite",
        "float": "float 6s ease-in-out infinite",
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
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
