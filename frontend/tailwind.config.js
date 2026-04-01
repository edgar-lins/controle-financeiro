/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface": "#0b1326",
        "on-surface": "#dae2fd",
        "surface-container-highest": "#2d3449",
        "surface-container-high": "#222a3d",
        "surface-container-low": "#131b2e",
        "surface-bright": "#31394d",
        "primary": "#5af0b3",
        "on-primary": "#003825",
        "primary-container": "#34d399",
        "secondary": "#bcc7de",
        "secondary-container": "#3e495d",
        "tertiary": "#ffc9cc",
        "tertiary-container": "#ffa1a7",
        "outline-variant": "#3c4a42",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}