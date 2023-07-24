/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.js", "./fonts"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Noto Sans KR", "sans-serif"],
      },
      colors: {
        mainColor1: "#03045e",
        mainColor2: "#023e8a",
        mainColor3: "#0077b6",
        mainColor4: "#0096c7",
        mainColor5: "#00b4d8",
        mainColor6: "#48cae4",
        mainColor4: "#90e0ef",
        mainColor5: "#ade8f4",
        mainColor6: "#caf0f8",
        darkGray: "#4A4453",
        normalGray: "#7B7485",
        buttonRed: "#82102D",
        buttonBlue: "#023E8A",
        buttonPink: "#BC4B5A",
        buttonGray: "#747687",
        buttonSilver: "#A8AABC",
        buttonZamboa: "#FFB149",
        buttonGreen: "#2E8F8B",
        buttonZamboa: "#ED6A4A",

        mainBlue: "#2E58EB",
        mainInputColor: "#F3F6F9",
        mainInputFocusColor: "#EAEDF2",
      },
      height: {
        rate5: "50vh",
        rate6: "60vh",
        rate7: "70vh",
      },
    },
  },
  plugins: [],
};
