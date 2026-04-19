import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core
        ink:    "#1C1814",
        paper:  "#F7F4EE",
        smoke:  "#EDEBE4",
        stone:  "#9A9288",
        // Accent
        yellow: "#FFE141",
        // Japandi autumnal card palette
        terra:  "#A85C38",
        sage:   "#4A6955",
        amber:  "#9B7A3A",
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        body:    ["'Fraunces'", "Georgia", "serif"],
        ui:      ["'DM Sans'", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":  "fadeIn 0.35s ease-out",
        "slide-up": "slideUp 0.35s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
