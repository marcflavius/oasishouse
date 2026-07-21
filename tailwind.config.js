/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Caribbean-inspired dark palette
        ocean: "#0891b2",
        lagoon: "#22d3ee",
        sand: "#fef3c7",
        coral: "#fb7185",
        sunset: "#f97316",
        deep: "#020617",
        midnight: "#0b1729",
        abyss: "#050b17",
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
