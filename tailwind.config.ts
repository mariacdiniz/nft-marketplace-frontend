import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#140E0B",
        panel: "#1C1511",
        card: "#241A15",
        line: "#3A2C24",
        kurio: {
          orange: "#E08A3A",
          orangeHover: "#F09A4A",
          cream: "#F4EBE3",
          muted: "#C9B8A8",
          dim: "#8A7768",
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', "Impact", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 2px rgba(224,138,58,0.45)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
