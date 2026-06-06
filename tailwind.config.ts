// tailwind.config.ts - CORRECT PATHS
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        organic: {
          50: "#f1f7ed",
          100: "#e3f1e8",
          200: "#d9ebdf",
          600: "#2d6a4f",
          700: "#1b4332",
        },
      },
    },
  },
  plugins: [],
};

export default config;
