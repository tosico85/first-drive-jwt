//const BASE_URL = "https://6corps.co.kr"; //화물24 API URL
const BASE_URL = "https://localhost:443"; //화물24 API URL
const JUSO_URL = process.env.API_JUSO_URL;

//User
const USER_JOIN = "/user/join";
const USER_LOGIN = "/user/login";
const USER_LOGIN_SUCCESS = "/user/loginSuccess";
const USER_LOGIN_FAILED = "/user/loginFailed";
const USER_LOGOUT = "/user/logout";
const USER_LOGIN_CHECK = "/user/sessionCheck";

//User Address
const USER_ADDRESS_LIST = "/user/address/list"; //주소목록 조회
const USER_ADDRESS_BASE = "/user/address/base"; //기본주소 조회
const USER_ADDRESS_ADD = "/user/address/add"; //주소 등록 (상하차지구분, 주소(시도, 시군구, 동, 상세주소)로 merge처리)
const USER_ADDRESS_DEL = "/user/address/del"; //주소 등록 (상하차지구분, 주소(시도, 시군구, 동, 상세주소)로 merge처리)

//ADMIN APIs  (TO-DO)
const ADMIN_GET_USER_LIST = "/admin/get/user/list"; //사용자 목록 조회
const ADMIN_CHANGE_USER = "/admin/change/user"; //사용자 권한 변경
const ADMIN_GET_CARGO_ORDER = "/admin/get/cargo/order"; //화물정보조회
const ADMIN_MOD_CARGO_ORDER = "/admin/mod/cargo/order"; //화물부가정보조회(수수료/운송료)

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

//Common
const COMMON_GET_FARE = "/common/get/fare"; //운행구간 별 요금 조회

const apiPaths = {
  baseUrl: BASE_URL,

  // User auth & login
  userJoin: USER_JOIN,
  userLogin: USER_LOGIN,
  userLoginSuccess: USER_LOGIN_SUCCESS,
  userLoginFailed: USER_LOGIN_FAILED,
  userLogout: USER_LOGOUT,
  userSessionCheck: USER_LOGIN_CHECK,

  // User address manage
  userAddressList: USER_ADDRESS_LIST,
  userAddressBase: USER_ADDRESS_BASE,
  userAddressAdd: USER_ADDRESS_ADD,
  userAddressDel: USER_ADDRESS_DEL,

  // Admin
  adminGetUserList: ADMIN_GET_USER_LIST,
  adminChangeUser: ADMIN_CHANGE_USER,
  adminGetCargoOrder: ADMIN_GET_CARGO_ORDER,
  adminModCargoOrder: ADMIN_MOD_CARGO_ORDER,

  // Cust
  custReqAddCargoOrder: CUST_REQ_ADD_CARGO_ORDER,
  custReqModCargoOrder: CUST_REQ_MOD_CARGO_ORDER,
  custReqGetCargoOrder: CUST_REQ_GET_CARGO_ORDER,
  custReqCancelCargoOrder: CUST_REQ_CANCEL_CARGO_ORDER,

  // Call24 APIs
  apiOrderAdd: API_ORDER_ADD,
  apiOrderMod: API_ORDER_MOD,
  apiOrderCancel: API_ORDER_CANCEL,
  apiOrderAddr: API_ORDER_ADDR,
  apiOrderCargoTon: API_ORDER_CARGOTON,
  apiOrderTruckType: API_ORDER_TRUCKTYPE,
  apiOrderGetOne: API_ORDER_GET_ONE,
  apiOrderGetAll: API_ORDER_GET_ALL,
  apiAllocCancel: API_ALLOC_CANCEL,
  apiReturnAllocNotice: API_RETURN_ALLOC_NOTICE,

  // 주소 URL
  apiJusoUrl: JUSO_URL,

  // Common
  commonGetFare: COMMON_GET_FARE,
};

export default apiPaths;
