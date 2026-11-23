/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Bright storefront palette. Token names are historical: "espresso" = page surfaces (cream),
        // "oat" = ink text. ink = Roasted Espresso #231712.
        // Surface/ink tokens are CSS variables (base.css :root), so a section can flip them with .theme-dark.
        espresso: { DEFAULT: "rgb(var(--c-surface) / <alpha-value>)", 2: "rgb(var(--c-surface-2) / <alpha-value>)", 3: "rgb(var(--c-surface-3) / <alpha-value>)" },
        oat: { DEFAULT: "rgb(var(--c-text) / <alpha-value>)", 2: "rgb(var(--c-text) / .78)", 3: "rgb(var(--c-text) / .66)" },
        ink: "#231712",
        line: "rgb(var(--c-text) / .16)",
        matcha: "#5F9E4E",
        strawberry: "#E0566C",
        pistachio: "#A9C77E",
        choco: "#4A2617",
        caramel: "#C98B4F",
        // neon = Neon Sign Pink for fills/large type; neon-2 = deep raspberry for small text (AA on cream)
        neon: { DEFAULT: "#FF4D8D", 2: "rgb(var(--c-pinktext) / <alpha-value>)" },
        gold: "#C99A2E",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
      },
      borderRadius: { card: "22px" },
      transitionTimingFunction: { out: "cubic-bezier(.16,1,.3,1)" },
      boxShadow: { neon: "0 0 0 1px rgba(255,77,141,.4), 0 10px 40px rgba(255,77,141,.35)", tactile: "4px 4px 0 #231712", "tactile-sm": "3px 3px 0 #231712" },
    },
  },
  plugins: [],
};
