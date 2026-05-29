/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#f8fafc",
          card: "#ffffff",
        },
        ink: {
          DEFAULT: "#0f172a",
          muted: "#64748b",
        },
        brand: {
          DEFAULT: "#4f46e5",
          hover: "#4338ca",
        },
        buttoncolor: {
          DEFAULT: "#000000",
          hover: "#4338ca",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
