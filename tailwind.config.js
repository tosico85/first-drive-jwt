/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.js", "./fonts"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Noto Sans KR", "sans-serif"],
      },
      colors: {
        rectangleHeader: "#89C0F8",
        layoutHeader: "#1C449C",
        richBlack: "#001219",
        midnightGreen: "#005F73",
        darkCyan: "#0A9396",
        tiffanyBlue: "#94D2BD",
        vanilla: "#E9D8A6",
        gamboge: "#EE9B00",
        alloyOrange: "#CA6702",
        rust: "#BB3E03",
        rufous: "#AE2012",
        auBurn: "#9B2226",
      },
    },
  },
  plugins: [],
};
