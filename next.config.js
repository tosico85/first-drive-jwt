const BASE_URL = "https://www.6corps.co.kr";

//User
const USER_JOIN = "/user/join";
const USER_LOGIN = "/user/login";
const USER_LOGIN_SUCCESS = "/user/loginSuccess";
const USER_LOGIN_FAILED = "/user/loginFailed";
const USER_LOGOUT = "/user/logout";

//ADMIN APIs  (TO-DO)
const ADMIN_GET_USER_LIST = "/admin/get/user/list"; //사용자 목록 조회
const ADMIN_CHANGE_AUTH = "/admin/change/auth"; //사용자 권한 변경
const ADMIN_GET_CARGO_ORDER = "/admin/get/cargo/order"; //화물정보조회

//Call24 APIs (ADMIN)
const API_ORDER_ADD = "/api/order/addOrder"; //화물등록
const API_ORDER_MOD = "/api/order/modOrder"; //화물수정
const API_ORDER_CANCEL = "/api/order/cancelOrder"; //화물취소
const API_ORDER_ADDR = "/api/order/addr"; //주소
const API_ORDER_CARGOTON = "/api/order/cargoTon"; //차량톤수
const API_ORDER_TRUCKTYPE = "/api/order/truckType"; //차량종류
const API_ORDER_GET_ONE = "/api/order/getOrder"; //화물등록내역(건별)
const API_ORDER_GET_ALL = "/api/order/getOrderAll"; //화물등록내역(전체) - 미사용
const API_ALLOC_CANCEL = "/api/order/cancelAlloc"; //배차취소

//배차알림: from call24(inbound)
const API_RETURN_ALLOC_NOTICE = "/api/return/allocNotice";

//화주 호출 API
const CUST_REQ_GET_CARGO_ORDER = "/cust/req/get/cargoOrder"; //화물정보 요청(DB)
const CUST_REQ_ADD_CARGO_ORDER = "/cust/req/add/cargoOrder"; //화물정보 등록(DB)
const CUST_REQ_MOD_CARGO_ORDER = "/cust/req/mod/cargoOrder"; //화물정보 수정(DB)
const CUST_REQ_CANCEL_CARGO_ORDER = "/cust/req/cancel/cargoOrder"; //화물정보 취소(DB)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/user/join",
        destination: `${BASE_URL}${USER_JOIN}`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/aaa",
        destination: "/bbb",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
