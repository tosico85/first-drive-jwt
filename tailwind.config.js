/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.js", "./fonts"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Noto Sans KR", "sans-serif"],
      },
    },
  },
  plugins: [],
};
