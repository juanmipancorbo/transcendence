import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{css}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary-fixed":               "#00eefc",
        "on-surface-variant":          "#acaab1",
        "on-surface":                  "#f8f5fd",
        "on-primary-fixed":            "#003f43",
        "tertiary-container":          "#b90afc",
        "surface-bright":              "#2c2b33",
        "error":                       "#ff6e84",
        "surface-dim":                 "#0e0e13",
        "outline":                     "#76747b",
        "surface-container-low":       "#131318",
        "secondary-dim":               "#8455ef",
        "tertiary":                    "#d575ff",
        "primary":                     "#8ff5ff",
        "on-secondary":                "#280067",
        "error-dim":                   "#d73357",
        "on-background":               "#f8f5fd",
        "on-secondary-container":      "#d9c8ff",
        "surface":                     "#0e0e13",
        "on-tertiary":                 "#390050",
        "error-container":             "#a70138",
        "secondary":                   "#ac8aff",
        "surface-container-high":      "#1f1f26",
        "secondary-container":         "#5516be",
        "on-primary":                  "#005d63",
        "on-primary-container":        "#005359",
        "surface-tint":                "#8ff5ff",
        "surface-container":           "#19191f",
        "surface-variant":             "#25252c",
        "background":                  "#0e0e13",
        "outline-variant":             "#48474d",
        "surface-container-highest":   "#25252c",
        "primary-container":           "#00eefc",
        "primary-dim":                 "#00deec",
        "surface-container-lowest":    "#000000",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg:      "0.25rem",
        xl:      "0.5rem",
        full:    "0.75rem",
      },
      fontFamily: {
        headline: ["Space Grotesk", "sans-serif"],
        body:     ["Manrope", "sans-serif"],
        label:    ["Manrope", "sans-serif"],
      },
      keyframes: {
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px 2px rgba(143,245,255,0.08)" },
          "50%":      { boxShadow: "0 0 40px 8px rgba(143,245,255,0.22)" },
        },
      },
      animation: {
        "slide-up":   "slide-up 0.4s cubic-bezier(0.2,1,0.3,1) both",
        "fade-in":    "fade-in 0.3s ease both",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
