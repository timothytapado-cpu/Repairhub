/** @type {import('tailwindcss').Config} */
// Colours come straight from the Figma "ux/*" variables.
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0e1963", 700: "#16276f", 900: "#0a1445" },
        brand: { DEFAULT: "#2f5bff", 600: "#2147e0", 50: "#e6ecff" },
        ink: { DEFAULT: "#141a3d", soft: "#58638f" },
        canvas: "#f3f5fc",
        line: { DEFAULT: "#e0e4f3", strong: "#c9d0ea" },
        ok: { bg: "#ddf5e8", text: "#07502f" },
        bad: { bg: "#fde4e4", text: "#7a1a14" },
        warn: { bg: "#fff0c9", text: "#6b4700" },
        you: "#e4572e",
        "on-dark": "#b9c3f4",
      },
      fontFamily: { sans: ["Manrope", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
