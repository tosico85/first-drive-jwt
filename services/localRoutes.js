const localRoutes = [
  { path: "/404", name: "Page Not Found." },
  { path: "/", name: "배차관리 시스템" },
  { path: "/login", name: "로그인" },
  { path: "/user/profile", name: "Profile" },
  { path: "/orders/list", name: "화물 목록" },
  { path: "/orders/create", name: "화물 등록" },
  { path: "/orders/modify", name: "화물 수정" },
  { path: "/orders/detail", name: "화물 상세" },

  { path: "/manage/group/list", name: "그룹 관리" },
  { path: "/manage/user/list", name: "사용자 관리" },
  { path: "/manage/fareTable/list", name: "운행요금 관리" },
];

export default localRoutes;
