/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Caribbean-inspired palette
        ocean: "#0891b2",
        lagoon: "#06b6d4",
        sand: "#fef3c7",
        coral: "#f97316",
        deep: "#0e2a3b",
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
