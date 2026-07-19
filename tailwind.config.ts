import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kraft-paper beige (warm, muted, slightly grayish)
        paper: "var(--color-paper)",
        // Cleaner off-white for cards
        surface: "var(--color-surface)",
        // Warm near-black for primary text
        ink: {
          DEFAULT: "var(--color-ink)",
          light: "var(--color-ink-light)",
        },
        // Deep ink-blue for actionable elements
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        // Muted burnt-sienna/wax-seal tone for signature moments
        signature: "var(--color-signature)",
        // Muted data colors for charts/P&L
        data: {
          up: "var(--color-data-up)",
          down: "var(--color-data-down)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 2px 4px rgba(44, 42, 40, 0.04), 0 1px 2px rgba(44, 42, 40, 0.02)",
        "card-hover": "0 4px 8px rgba(44, 42, 40, 0.06), 0 2px 4px rgba(44, 42, 40, 0.04)",
      },
      borderColor: {
        hairline: "var(--color-hairline)",
      }
    },
  },
  plugins: [],
};
export default config;
