import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--color-paper)",
        surface: "var(--color-surface)",
        ink: {
          DEFAULT: "var(--color-ink)",
          light: "var(--color-ink-light)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        signature: "var(--color-signature)",
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
