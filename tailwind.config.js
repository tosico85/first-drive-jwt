/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.js", "./fonts"],
  theme: {
    extend: {
      fontFamily: {
        NotoMedium: ["NotoMedium", "sans-serif"],
        AritaThin: ["AritaThin", "sans-serif"],
        AritaMedium: ["AritaMedium", "sans-serif"],
        AritaSemiBold: ["AritaSemiBold", "sans-serif"],
        AritaBold: ["AritaBold", "sans-serif"],
        NotoSansKRThin: ["NotoSansKRThin", "sans-serif"],
        NotoSansKRMedium: ["NotoSansKRMedium", "sans-serif"],
      },

      colors: {
        mainColor1: "#03045e",
        mainColor2: "#283670", //모바일 list header 색상
        mainColor4: "#607ffc", //모바일 list header bar 색상
        subBgColor4: "#f4f5f9", // 모바일 list bg 컬러
        subBgColor5: "#fbfbfd", // 모바일 order bg 컬러
        mainColor3: "#455599",
        mainColor5: "#00b4d8",
        mainColor6: "#48cae4",
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
        navStroke: "#455599",
        mainBlue: "#283670", //PC navSide 색상
        boxColor1: "#7590bc", // PC HOME CARD LEFT 색상
        homeBgColor1: "#f4f5fa", // PC HOME BG 색상
        mainBgColor: "#F7F7F7",
        subBgColor1: "#5F7F96",
        subBgColor2: "#CCCCCC",
        //        subBgColor3: "#f4f7f9",
        subBgColor3: "#ffffff",

        headerColor1: "#336699",
        headerColor2: "#405096",
        maroonColor: "#6e323b",
        titleButtonColor: "#999999",
        mainInputColor: "#F3F6F9",
        mainInputFocusColor: "#EAEDF2",

        pastelBlue: "#6395b4", // 더 진한 파스텔 블루
        pastelYellow: "#e0ca5e", // 더 진한 파스텔 옐로우
        pastelGreen: "#9dbd7c", // 더 진한 파스텔 그린
        pastelRed: "#ed6666", // 더 진한 파스텔 레드
      },

      height: {
        rate5: "50vh",
        rate6: "60vh",
        rate7: "70vh",
        rate8: "80vh",
      },
      spacing: {
        26: "108px",
      },
    },
  },
  plugins: [],
};
