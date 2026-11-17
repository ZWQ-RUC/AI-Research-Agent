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
        academic: {
          50: "#f8fafc",
          100: "#f1f5f9",
          700: "#1e3a8a",
          800: "#0f172a",
          900: "#020617",
        },
      },
    },
  },
  plugins: [],
};

export default config;
