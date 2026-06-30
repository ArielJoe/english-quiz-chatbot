import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fce8",
          100: "#ddf7c4",
          200: "#bff08c",
          300: "#98e44d",
          400: "#76d626",
          500: "#58cc02",
          600: "#46a302",
          700: "#387f06",
          800: "#2f640c",
          900: "#28510f"
        }
      },
      boxShadow: {
        panel: "0 20px 55px rgba(40, 81, 15, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
