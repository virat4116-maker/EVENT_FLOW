/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2effe",
          100: "#e6e0fd",
          200: "#c9befc",
          300: "#a595f6",
          400: "#8a71f0",
          500: "#6d4de8",
          600: "#5a35d6",
          700: "#4b28b3",
          800: "#3c2190",
          900: "#2e1a6e",
        },
        electric: "#7c3aed",
      },
      fontFamily: {
        display: ["'Clash Display'", "'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -6px rgba(76, 41, 196, 0.12)",
        card: "0 2px 10px -2px rgba(30, 20, 70, 0.08)",
        glow: "0 0 0 1px rgba(124,58,237,0.08), 0 12px 32px -8px rgba(124,58,237,0.28)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
