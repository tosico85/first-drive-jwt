const BASE_URL = "https://6corps.co.kr"; //화물24 API URL
//const BASE_URL = "https://localhost:443"; //화물24 API URL
const JUSO_URL = process.env.API_JUSO_URL;

//User
const USER_JOIN = "/user/join";
const USER_LOGIN = "/user/login";
const USER_LOGIN_SUCCESS = "/user/loginSuccess";
const USER_LOGIN_FAILED = "/user/loginFailed";
const USER_LOGOUT = "/user/logout";
const USER_LOGIN_CHECK = "/user/sessionCheck";
const USER_CHANGE_PASSWORD = "/user/change/password";

//User Address
const USER_ADDRESS_LIST = "/user/address/list"; //주소목록 조회
const USER_ADDRESS_BASE = "/user/address/base"; //기본주소 조회
const USER_ADDRESS_ADD = "/user/address/add"; //주소 등록 (상하차지구분, 주소(시도, 시군구, 동, 상세주소)로 merge처리)
const USER_ADDRESS_DEL = "/user/address/del"; //주소 등록 (상하차지구분, 주소(시도, 시군구, 동, 상세주소)로 merge처리)

//User Bookmark
const USER_BOOKMARK_LIST = "/user/bookmark/list"; //주소목록 조회
const USER_BOOKMARK_ADD = "/user/bookmark/add"; //주소 등록 (계정, 거래처명로 insert처리)
const USER_BOOKMARK_MERGE = "/user/bookmark/merge"; //주소 등록 (계정, 거래처명로 merge처리)
const USER_BOOKMARK_UPDATE = "/user/bookmark/upd상ate"; //주소 등록 (계정, 거래처명로 update처리)
const USER_BOOKMARK_DEL = "/user/bookmark/del"; //주소 등록 (계정, 거래처명로 delete처리)

//ADMIN APIs  (TO-DO)
const ADMIN_GET_USER_LIST = "/admin/get/user/list"; //사용자 목록 조회
const ADMIN_CHANGE_USER = "/admin/change/user"; //사용자 권한 변경
const ADMIN_GET_CARGO_ORDER = "/admin/get/cargo/order"; //화물정보조회
const ADMIN_MOD_CARGO_ORDER = "/admin/mod/cargo/order"; //화물부가정보조회(수수료/운송료)
const ADMIN_CHANGE_ORDER_STATUS = "/admin/change/order/status"; //화물오더상태변경
const ADMIN_ADD_ORDER_RECEIPT = "/admin/add/order/receipt"; //인수증 등록
const ADMIN_GET_FARE = "/admin/get/fare"; //운송료 관리(조회)
const ADMIN_ADD_FARE = "/admin/add/fare"; //운송료 관리(등록)
const ADMIN_MOD_FARE = "/admin/mod/fare"; //운송료 관리(수정)
const ADMIN_DEL_FARE = "/admin/del/fare"; //운송료 관리(삭제)
const ADMIN_LOAD_FARE = "/admin/load/fare"; //운송료 관리(기본요금으로부터 복사)
const ADMIN_GET_GROUP = "/admin/get/group"; //그룹 관리(조회)
const ADMIN_ADD_GROUP = "/admin/add/group"; //그룹 관리(등록)
const ADMIN_MOD_GROUP = "/admin/mod/group"; //그룹 관리(수정)
const ADMIN_DEL_GROUP = "/admin/del/group"; //그룹 관리(삭제)
const ADMIN_DIRECT_ALLOC = "/admin/direct/alloc"; //수기 배차(접수중=>배차완료)
const ADMIN_CHANGE_PASSWORD = "/admin/change/password"; //사용자 비번 변경

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
const CUST_REQ_GET_ORDER_RECEIPT = "/cust/req/get/orderReceipt"; //인수증 이미지 조회

//Common
const COMMON_GET_FARE = "/common/get/fare"; //운행구간 별 요금 조회
const COMMON_GET_DASHBOARD = "/common/get/dashboard"; //통계(대시보드)
const COMMON_GET_GROUP = "/common/get/group"; //그룹 조회

const apiPaths = {
  baseUrl: BASE_URL,

  // User auth & login
  userJoin: USER_JOIN,
  userLogin: USER_LOGIN,
  userLoginSuccess: USER_LOGIN_SUCCESS,
  userLoginFailed: USER_LOGIN_FAILED,
  userLogout: USER_LOGOUT,
  userSessionCheck: USER_LOGIN_CHECK,
  userChangePassword: USER_CHANGE_PASSWORD,

  // User address manage
  userAddressList: USER_ADDRESS_LIST,
  userAddressBase: USER_ADDRESS_BASE,
  userAddressAdd: USER_ADDRESS_ADD,
  userAddressDel: USER_ADDRESS_DEL,

  // User address manage
  userBookmarkList: USER_BOOKMARK_LIST,
  userBookmarkAdd: USER_BOOKMARK_ADD,
  userBookmarkMerge: USER_BOOKMARK_MERGE,
  userBookmarkUpdate: USER_BOOKMARK_UPDATE,
  userBookmarkDel: USER_BOOKMARK_DEL,

  // Admin
  adminGetUserList: ADMIN_GET_USER_LIST,
  adminChangeUser: ADMIN_CHANGE_USER,
  adminGetCargoOrder: ADMIN_GET_CARGO_ORDER,
  adminModCargoOrder: ADMIN_MOD_CARGO_ORDER,
  adminChangeOrderStatus: ADMIN_CHANGE_ORDER_STATUS,
  adminAddOrderReceipt: ADMIN_ADD_ORDER_RECEIPT,
  adminGetFare: ADMIN_GET_FARE,
  adminAddFare: ADMIN_ADD_FARE,
  adminModFare: ADMIN_MOD_FARE,
  adminDelFare: ADMIN_DEL_FARE,
  adminLoadFare: ADMIN_LOAD_FARE,
  adminDirectAlloc: ADMIN_DIRECT_ALLOC,
  adminGetGroup: ADMIN_GET_GROUP,
  adminAddGroup: ADMIN_ADD_GROUP,
  adminModGroup: ADMIN_MOD_GROUP,
  adminDelGroup: ADMIN_DEL_GROUP,
  adminDirectAlloc: ADMIN_DIRECT_ALLOC,
  adminChangePassword: ADMIN_CHANGE_PASSWORD,

  // Cust
  custReqAddCargoOrder: CUST_REQ_ADD_CARGO_ORDER,
  custReqModCargoOrder: CUST_REQ_MOD_CARGO_ORDER,
  custReqGetCargoOrder: CUST_REQ_GET_CARGO_ORDER,
  custReqCancelCargoOrder: CUST_REQ_CANCEL_CARGO_ORDER,
  custReqGetOrderReceipt: CUST_REQ_GET_ORDER_RECEIPT,

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
  commonGetDashboard: COMMON_GET_DASHBOARD,
  commonGetGroup: COMMON_GET_GROUP,
};

export default apiPaths;
