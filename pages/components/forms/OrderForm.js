import { Controller, useForm } from "react-hook-form";
import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";
import AddressForm from "./AddressForm";
import DateInput from "../custom/DateInput";
import { useRouter } from "next/router";
import { format } from "date-fns";
import AuthContext from "../../context/authContext";
import Modal from "react-modal";
//import UserAddressModal from "../modals/UserAddressModal";
import { isEmptyObject } from "../../../utils/ObjectUtils";
import {
  addCommas,
  convertTo12HourFormat,
  formatDate,
  formatPhoneNumber,
  getDayYYYYMMDD,
  getNextHourHH,
  getPayPlanYmd,
  isEmpty,
} from "../../../utils/StringUtils";
import SearchAddressModal from "../modals/SearchAddressModal";
import DateTimeSelectModal from "../modals/DateTimeSelectModal";
import Label from "../custom/Label";
import TodayTimeSelectModal from "../modals/TodayTimeSelectModal";
import UserBookmarkModal from "../modals/UserBookmarkModal";
import UserAccountSelectModal from "../modals/UserAccountSelectModal";

export default function OrderForm({
  isEdit = false,
  isCopy = false,
  editData = {},
  isDirectApi = false,
  userInfo,
}) {
  const router = useRouter();
  const { requestServer } = useContext(AuthContext);

  const [recentCargoList, setRecentCargoList] = useState([]);

  const [cargoTonList, setCargoTonList] = useState([]);
  const [truckTypeList, setTruckTypeList] = useState([]);

  //Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isResvTimeModalOpen, setIsResvTimeModalOpen] = useState(false);
  const [isTodayTimeModalOpen, setIsTodayTimeModalOpen] = useState(false);
  const [isUserAccountSelectModalOpen, setIsUserAccountSelectModalOpen] =
    useState(false);
  const [modalStartEnd, setModalStartEnd] = useState("");
  const [modalResvDateTime, setModalResvDateTime] = useState({});
  const [modalTodayDateTime, setModalTodayDateTime] = useState({});

  //prefill data
  const [startAddressData, setStartAddressData] = useState({
    startWide: editData.startWide,
    startSgg: editData.startSgg,
    startDong: editData.startDong,
  });
  const [endAddressData, setEndAddressData] = useState({
    endWide: editData.endWide,
    endSgg: editData.endSgg,
    endDong: editData.endDong,
  });

  //운송료 map
  const [fareMap, setFareMap] = useState({});

  //상하차일시 내용
  const [planTimeStatement, setPlanTimeStatement] =
    useState("지금 상차 / 당착");

  //차량선택(트럭/라보/다마스)
  const [carType, setCarType] = useState("truck");

  //base data
  const LOAD_TYPE_LIST = [
    "지게차",
    "수작업",
    "크레인",
    "호이스트",
    "컨베이어",
    "기타",
  ];
  const PAY_TYPE_LIST = ["선착불", "인수증", "카드"];

  //react-form 관련
  const methods = useForm({
    mode: "onSubmit",
    defaultValues: {
      firstType: "01",
      frgton: "0", // 여기서 기본값 0 지정
      // 다른 필드 기본값들...
    },
  });
  const {
    reset,
    register,
    handleSubmit,
    getValues,
    setValue,
    clearErrors,
    watch,
    control,
    formState: { errors },
  } = methods;

  //watch datas
  const watchFarePayType = watch("farePaytype");
  const watchStartSgg = watch("startSgg");
  const watchEndSgg = watch("endSgg");
  const watchCargoTon = watch("cargoTon");
  const watchTruckType = watch("truckType");
  const watchShuttleCargoInfo = watch("shuttleCargoInfo");
  let addressPopupStartEnd = "";
  let startBaseYn = "N";
  let endBaseYn = "N";
  //let fareMap = {};
  const isAdmin = userInfo.auth_code === "ADMIN";

  const [isMobile, setIsMobile] = useState(false);

  /**
   * 화면 로딩 시 event
   */
  useEffect(() => {
    if (!isEmptyObject(userInfo)) {
      (async () => {
        const { code, data } = await requestServer(
          apiPaths.apiOrderCargoTon,
          {}
        );
        if (code === 1) {
          setCargoTonList(data);
        }

        initDateTime(); //날짜 시간 초기값 세팅
        initDefaultValues(); //초기값 세팅

        setPlanTimeStatement(getTimeState());

        if (isEdit || isCopy) {
          console.log("EditData >> ", editData);
          await loadParamData();
        } else {
          //console.log("Prefill ..");
          //prefillBaseAddress();
        }

        await getOrderList();
      })();
    }
    setIsMobile(window.innerWidth <= 768);
  }, [userInfo]);

  //운송료 착불인 경우 세금계산서 disable 처리(값 변경 시 이벤트)
  useEffect(() => {
    //console.log("changed.!! ", watchFarePayType);

    if (watchFarePayType === "선착불") {
      setValue("taxbillType", false);
    } else {
      setValue("taxbillType", true);
    }
  }, [watchFarePayType]);

  //시군구 변경 시 운행요금 자동 계산
  useEffect(() => {
    /*if (!isAdmin) {
      return;
    }*/

    const [startWide, startSgg, endWide, endSgg] = getValues([
      "startWide",
      "startSgg",
      "endWide",
      "endSgg",
    ]);

    //console.log({ startWide, startSgg, endWide, endSgg });
    if (
      isEmpty(startWide) ||
      isEmpty(startSgg) ||
      isEmpty(endWide) ||
      isEmpty(endSgg)
    ) {
      return;
    }

    //...운행요금 계산
    (async () => {
      await setFareByDistance({ startWide, startSgg, endWide, endSgg });
    })();
  }, [watchStartSgg, watchEndSgg]);

  // 차량 톤수에 따른 운행요금 변경
  useEffect(() => {
    console.log(watchCargoTon);
    console.log(fareMap);
    if (!isEmptyObject(fareMap)) {
      if (!isEmpty(watchCargoTon)) {
        setFareByCargoTon(watchCargoTon);
      }
    }
  }, [watchCargoTon, watchTruckType, watchShuttleCargoInfo]);

  // 운행요금 조회 시 차량톤수에 따른 운행료 세팅
  useEffect(() => {
    const cargoTon = getValues("cargoTon");

    //차량 톤수가 선택된 경우
    if (!isEmpty(cargoTon) && !isEmptyObject(fareMap)) {
      setFareByCargoTon(cargoTon);
    }

    console.log("result >> ", fareMap);
  }, [fareMap]);

  useEffect(() => {
    if (carType == "truck") {
      setValue("cargoTon", "");
      setValue("truckType", "");
    } else {
      if (carType == "labo" || carType == "damas") {
        setValue("cargoTon", "0.5");
      } else if (carType == "motorcycle") {
        setValue("cargoTon", "기본");
      }
      (async () => {
        await getTruckTypeList();

        if (carType == "labo") {
          setValue("truckType", "라보");
        } else if (carType == "damas") {
          setValue("truckType", "다마스");
        } else {
          setValue("truckType", "오토바이");
        }
      })();
    }
  }, [carType]);

  //상하차지 변경에 따른 운행요금 조회
  const setFareByDistance = async (params) => {
    const result = await requestServer(apiPaths.commonGetFare, params);
    setFareMap(result);
  };

  // 차량 톤수에 대한 운행료 계산
  const setFareByCargoTon = (cargoTon) => {
    if (cargoTon == "특송" || cargoTon == "기본") return;

    try {
      const floatCargoTon = Number.parseFloat(cargoTon);
      let resultFare = "0";
      const {
        oneTon,
        twoHalfTon,
        threeHalfTon,
        fiveTon,
        fiveTonPlus,
        elevenTon,
        eighteenTon,
        twentyfiveTon,
      } = fareMap;

      if (floatCargoTon <= 1) {
        resultFare = oneTon;
      } else if (floatCargoTon <= 2.5) {
        resultFare = twoHalfTon;
      } else if (floatCargoTon <= 3.5) {
        resultFare = threeHalfTon;
      } else if (floatCargoTon <= 5) {
        resultFare = fiveTon;
        // 5톤축
        if (watchTruckType?.includes("축")) {
          resultFare = fiveTonPlus;
        }
      } else if (floatCargoTon <= 11) {
        resultFare = elevenTon;
      } else if (floatCargoTon <= 18) {
        resultFare = eighteenTon;
      } else {
        resultFare = twentyfiveTon;
      }

      if (watchShuttleCargoInfo) {
        resultFare = Number.parseInt(resultFare) * 1.8 + "";
      }
      setValue("fareView", resultFare);

      console.log("fareView", getValues("fareView"));
    } catch (e) {
      console.log(e);
      return;
    }
  };

  //배차신청 기본 값 설정
  const initDefaultValues = () => {
    //setValue("farePaytype", "인수증");
    setValue("인수증");
    setValue("payPlanYmd", getPayPlanYmd());
  };

  //날짜 시간 초기값 세팅
  const initDateTime = () => {
    const curDt = format(new Date(), "yyyyMMdd");
    setValue("startPlanDt", getValues("startPlanDt") || curDt);
    setValue("startPlanHour", getValues("startPlanHour") || getNextHourHH(1));
    setValue("startPlanMinute", getValues("startPlanMinute") || "00");
    setValue("endPlanDt", getValues("endPlanDt") || curDt);
    setValue("endPlanHour", getValues("endPlanHour") || getNextHourHH(1));
    setValue("endPlanMinute", getValues("endPlanMinute") || "00");
    setValue("payPlanYmd", getValues("payPlanYmd") || curDt);
  };

  // TEST DATA 로드
  const loadParamData = async () => {
    setValue("cargoTon", editData["cargoTon"] || "");

    if (editData["cargoTon"]) {
      await getTruckTypeList();
      Object.keys(editData).forEach((key) => {
        if (["group_name"].includes(key)) return; //제외항목
        if (["userName"].includes(key)) return; //제외항목
        if (["adminMemo"].includes(key)) return; //제외항목
        if (["receipt_add_yn"].includes(key)) return; //제외항목
        if (
          [
            "taxbillType",
            "multiCargoGub",
            "urgent",
            "shuttleCargoInfo",
          ].includes(key)
        ) {
          setValue(key, (editData[key] || "") != "");
        } else if (
          ["startAreaPhone", "endAreaPhone", "firstShipperInfo"].includes(key)
        ) {
          setValue(key, formatPhoneNumber(editData[key]));
        } else {
          setValue(key, editData[key]);

          if (key == "cargoTon") {
            if (editData["cargoTon"] == "0.5") {
              const truckType = editData["truckType"];
              if (truckType == "라보") {
                setCarType("labo");
              } else if (truckType == "다마스") {
                setCarType("damas");
              }
            } else if (
              editData["cargoTon"] == "특송" ||
              editData["cargoTon"] == "기본"
            ) {
              setCarType("motorcycle");
            } else {
              setCarType("truck");
            }
          }
        }
      });

      console.log("editData : ", editData);
      //console.log("cargoOrder : ", getValues());
    }
  };

  // 배차목록(최근)
  const getOrderList = async () => {
    const url =
      userInfo.auth_code == "ADMIN"
        ? apiPaths.adminGetCargoOrder
        : apiPaths.custReqGetCargoOrder;

    //최근 30일 배차목록 검색 후 10건만 노출
    const params = {
      start_dt: getDayYYYYMMDD(-30),
      end_dt: getDayYYYYMMDD(),
      delete_yn: "N",
    };

    let result = await requestServer(url, params);
    if (result) {
      if (result.length > 8) {
        result = result.slice(0, 8);
      }
      setRecentCargoList(() => result);
      console.log("Cargo order >>", result);
    }
  };

  // 배차목록 선택 시 화물오더 load
  const selectCargoOrder = async (index) => {
    if (isEdit) {
      alert("화물 수정 시에는 불러오기 기능을 이용할 수 없습니다.");
    } else {
      if (confirm("해당 오더를 불러오시겠습니까?")) {
        reset();
        let targetOrder = { ...recentCargoList[index] };
        setStartAddressData({
          startWide: targetOrder.startWide,
          startSgg: targetOrder.startSgg,
          startDong: targetOrder.startDong,
        });
        setEndAddressData({
          endWide: targetOrder.endWide,
          endSgg: targetOrder.endSgg,
          endDong: targetOrder.endDong,
        });

        // Copy 제외항목 필터링
        const paramData = (({
          cargo_seq,
          adminMemo,
          ordNo,
          startPlanDt,
          startPlanHour,
          startPlanMinute,
          endPlanDt,
          endPlanHour,
          endPlanMinute,
          payPlanYmd,
          cjName,
          cjPhone,
          cjCarNum,
          cjCargoTon,
          cjTruckType,
          fare,
          fareView,
          addFare,
          addFareReason,
          group_name,
          userName,
          receipt_add_yn,
          create_dtm,
          delete_yn,
          ...rest
        }) => rest)(targetOrder);

        editData = { ...paramData };
        initDateTime();
        initializeTimeFields();
        await loadParamData();
      }
    }
  };

  // 차량톤수 조회(콤보박스 셋팅용)
  const getTruckTypeList = async () => {
    const cargoTon = getValues("cargoTon");
    setTruckTypeList([]);

    if (cargoTon == "") {
    } else if (cargoTon == "특송" || cargoTon == "기본") {
      const data = [{ nm: "오토바이" }];
      setTruckTypeList(data);
      setValue("truckType", "오토바이");
    } else {
      const { code, data } = await requestServer(apiPaths.apiOrderTruckType, {
        cargoTon,
      });
      if (code === 1) {
        setTruckTypeList(data);

        if (cargoTon == "0.5") {
          if (carType == "labo") {
            setValue("truckType", "라보");
          } else if (carType == "damas") {
            setValue("truckType", "다마스");
          }
        }
      }
    }
  };

  // 상하차지 기본주소 프리필
  /* const prefillBaseAddress = async () => {
    //console.log(userInfo);

    const {
      result: { start, end },
    } = await requestServer(apiPaths.userAddressBase, {});

    if (Object.keys(start || {}).length > 0) {
      setStartAddressData({
        startWide: start.wide,
        startSgg: start.sgg,
        startDong: start.dong,
      });
      setValue("startDetail", start.detail);
      startBaseYn = start.baseYn;
    }

    if (Object.keys(end || {}).length > 0) {
      setEndAddressData({
        endWide: end.wide,
        endSgg: end.sgg,
        endDong: end.dong,
      });
      setValue("endDetail", end.detail);
      endBaseYn = end.baseYn;
    }
  }; */

  /**
   * 체크박스 control을 위한 처리
   */
  const checkboxValueReset = (object) => {
    // 체크박스의 true값을 db적재 값으로 변경
    [
      { key: "taxbillType", value: "Y" },
      { key: "multiCargoGub", value: "혼적" },
      { key: "urgent", value: "긴급" },
      { key: "shuttleCargoInfo", value: "왕복" },
      { key: "muteAlert", value: "Y" }, // ← 이 줄을 추가
    ].forEach((item) => {
      object[item.key] = object[item.key] ? item.value : "";
    });

    // 운송료지불구분의 경우 화주는 체크박스로 제공
    if (!isAdmin) {
      object["farePaytype"] = object["farePaytype"] ? "선착불" : "";
    }

    return object;
  };

  /**
   * 연락처 '-' 제거
   */
  const filterTelNoHyphen = (object) => {
    ["startAreaPhone", "endAreaPhone", "firstShipperInfo"].forEach((key) => {
      object[key] = object[key]?.replace(/[^0-9]/g, "") || "";
    });

    return object;
  };

  // 상하차지 주소정보 update
  /* const regStartEndAddress = async () => {
    let [wide, sgg, dong, detail] = getValues([
      "startWide",
      "startSgg",
      "startDong",
      "startDetail",
    ]);
    const startAddress = {
      wide,
      sgg,
      dong,
      detail,
      baseYn: startBaseYn,
      startEnd: "start",
    };
    await requestServer(apiPaths.userAddressAdd, startAddress);

    [wide, sgg, dong, detail] = getValues([
      "endWide",
      "endSgg",
      "endDong",
      "endDetail",
    ]);
    const endAddress = {
      wide,
      sgg,
      dong,
      detail,
      baseYn: endBaseYn,
      startEnd: "end",
    };
    await requestServer(apiPaths.userAddressAdd, endAddress);
  }; */

  /**
   * 화물 등록(화주가 화물 등록 하는 경우)
   */
  const createCargoOrder = async () => {
    const cargoOrder = (({ startAddress, endAddress, create_user, ...rest }) =>
      rest)(getValues());
    cargoOrder = checkboxValueReset(cargoOrder);
    cargoOrder = filterTelNoHyphen(cargoOrder);

    // 상하차지 주소정보 update
    //await regStartEndAddress();
    if (isAdmin) {
      cargoOrder = {
        ...cargoOrder,
        create_user: getValues("create_user") || userInfo.email,
      };
    }

    // 화물등록
    const { result, resultCd } = await requestServer(
      apiPaths.custReqAddCargoOrder,
      cargoOrder
    );

    if (resultCd === "00") {
      await insertBookmark();
      alert("화물 오더가 등록되었습니다.");
      router.push("/orders/list");
    } else {
      alert(result);
    }
  };

  /**
   * 북마크 추가
   */
  const insertBookmark = async () => {
    //북마크 적재 제외대상은 아 배열에 추가
    if (["agitech@agitech.kr"].includes(userInfo.email)) return;

    let [wide, sgg, dong, detail, bookmarkName, areaPhone] = getValues([
      "startWide",
      "startSgg",
      "startDong",
      "startDetail",
      "startCompanyName",
      "startAreaPhone",
    ]);

    let paramData = {
      bookmarkName,
      wide,
      sgg,
      dong,
      detail,
      areaPhone: areaPhone.replace(/[^0-9]/g, ""),
    };

    //상차지 등록
    await requestServer(apiPaths.userBookmarkMerge, paramData);

    [wide, sgg, dong, detail, bookmarkName, areaPhone] = getValues([
      "endWide",
      "endSgg",
      "endDong",
      "endDetail",
      "endCompanyName",
      "endAreaPhone",
    ]);

    paramData = {
      bookmarkName,
      wide,
      sgg,
      dong,
      detail,
      areaPhone: areaPhone.replace(/[^0-9]/g, ""),
    };

    //하차지 등록
    await requestServer(apiPaths.userBookmarkMerge, paramData);
  };

  /**
   * 화물 정보 update
   * - 화물 상태에 따른 호출 API를 다르게 하여 호출
   */
  const updateCargoOrder = async () => {
    // 1) 폼의 모든 값을 가져옵니다.
    const values = getValues();

    // 2) DB에 없는 필드들(startAddress, endAddress 등)을 구조분해할당으로 제외합니다.
    const {
      startAddress,
      endAddress,
      change_dtm,
      ordStatus,
      create_dtm,
      fee,
      alarm_talk,
      delete_yn,
      // ...필요에 따라 더 빼야 할 필드가 있으면 여기에 추가
      ...restValues
    } = values;

    // 3) change_user만 별도 추출하고 나머지를 cargoOrder로 사용합니다.
    const { change_user, ...payload } = restValues;
    console.log("change_user:", change_user);

    // 4) 체크박스·전화번호 처리
    let cargoOrder = checkboxValueReset(payload);
    cargoOrder = filterTelNoHyphen(cargoOrder);

    // 5) URL 결정
    let url = apiPaths.custReqModCargoOrder;
    if (isAdmin) {
      url = isDirectApi ? apiPaths.apiOrderMod : apiPaths.adminModCargoOrder;
    }

    // 6) API 호출 — 이제 payload에 DB 없는 칼럼이 없습니다.
    const { result, resultCd, code, message } = await requestServer(url, {
      ...cargoOrder,
      change_user, // 필요하면 넣고, 아니면 빼도 됩니다.
    });

    // 7) 응답 처리
    if (isDirectApi) {
      if (code === 1) {
        alert("배차 신청정보가 수정되었습니다.");
        router.push({
          pathname: "/orders/detail",
          query: { param: cargoOrder.cargo_seq },
        });
      } else {
        alert(message);
      }
    } else {
      if (resultCd === "00") {
        await insertBookmark();
        alert("화물 오더가 수정되었습니다.");
        router.push({
          pathname: "/orders/detail",
          query: { param: cargoOrder.cargo_seq },
        });
      } else {
        alert(result);
      }
    }
  };

  /**
   * submit invalid event
   * form 안의 모든 필수항목 입력된 경우 이 이벤트 ..
   */
  const onValid = () => {
    if (!checkValidate()) {
      return;
    }

    if (isEdit) {
      updateCargoOrder();
    } else {
      createCargoOrder();
    }
  };

  const checkValidate = () => {
    let result = true;
    let returnMsg = "";

    ["start", "end"].forEach((startEnd) => {
      ["PlanDt", "PlanHour", "PlanMinute"].forEach((time) => {
        console.log(`${startEnd}${time}`, getValues(`${startEnd}${time}`));
        if (isEmpty(getValues(`${startEnd}${time}`))) {
          console.log(`${startEnd}${time}`, getValues(`${startEnd}${time}`));
          result = false;
          returnMsg = "상/하차 일시를 입력해주세요.";
        }
      });
    });

    if (!result) {
      alert(returnMsg);
    }

    return result;
  };

  /**
   * submit invalid event
   * 누락된 값 있는 경우 이 이벤트..
   */
  const oninvalid = () => {
    //console.log(getValues("startPlanDt"));
    console.log(getValues());

    console.log(errors);
  };

  /********************************** Modal Control ***********************************/

  /**
   * 주소록 버튼 event handle
   * @param {event} e
   * @param {상하차 구분} startEnd
   */
  const handleAddressButton = (e, startEnd) => {
    e.preventDefault();
    setModalStartEnd(startEnd);
    console.log("modalStartEnd >> ", modalStartEnd);
    console.log("startEnd >> ", startEnd);
    openModal();
  };

  /**
   * 주소찾기 버튼 event handle
   * @param {event} e
   * @param {상하차 구분} startEnd
   */
  const handleAddressSearchButton = (startEnd) => {
    //e.preventDefault();
    setModalStartEnd(startEnd);
    console.log("startEnd >> ", startEnd);
    openAddressModal();
  };

  /**
   * 상하차일시 버튼 event handle
   * @param {event} e
   * @param {상하차 구분} startEnd
   */
  const handleResvTimeButton = (e) => {
    e.preventDefault();
    //setModalStartEnd(startEnd);
    //console.log("startEnd >> ", startEnd);

    let paramObj = {};
    // paramObj["PlanDt"] = getValues(`${startEnd}PlanDt`) || "";
    // paramObj["PlanHour"] = getValues(`${startEnd}PlanHour`) || "";
    // paramObj["PlanMinute"] = getValues(`${startEnd}PlanMinute`) || "";
    paramObj["PlanDt"] = getValues(`startPlanDt`) || "";
    paramObj["PlanHour"] = getValues(`startPlanHour`) || "";
    paramObj["PlanMinute"] = getValues(`startPlanMinute`) || "";
    paramObj["isEndToday"] = getValues(`startPlanDt`) == getValues(`endPlanDt`);

    setModalResvDateTime(paramObj);
    console.log("paramObj >> ", paramObj);

    openResvTimeModal();
  };

  /**
   * 상하차일시 버튼 event handle
   * @param {event} e
   * @param {상하차 구분} startEnd
   */
  const handleTodayTimeButton = (e) => {
    e.preventDefault();

    let paramObj = {};
    paramObj["startPlanDt"] = getValues(`startPlanDt`) || "";
    paramObj["startPlanHour"] = getValues(`startPlanHour`) || "";
    paramObj["startPlanMinute"] = getValues(`startPlanMinute`) || "";
    paramObj["endPlanDt"] = getValues(`endPlanDt`) || "";
    paramObj["endPlanHour"] = getValues(`endPlanHour`) || "";
    paramObj["endPlanMinute"] = getValues(`endPlanMinute`) || "";
    setModalTodayDateTime(paramObj);
    console.log("paramObj >> ", paramObj);

    openTodayTimeModal();
  };

  // Open 주소록 Modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Close 주소록 Modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Open 주소검색 Modal
  const openAddressModal = () => {
    setIsAddressModalOpen(true);
  };

  // Close 주소검색 Modal
  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
  };

  // Open 날짜 시간 선택 Modal
  const openResvTimeModal = () => {
    setIsResvTimeModalOpen(true);
  };

  // Close 날짜 시간 선택 Modal
  const closeResvTimesModal = () => {
    setIsResvTimeModalOpen(false);
  };

  // Open 날짜 시간 선택 Modal
  const openTodayTimeModal = () => {
    setIsTodayTimeModalOpen(true);
  };

  // Close 날짜 시간 선택 Modal
  const closeTodayTimesModal = () => {
    setIsTodayTimeModalOpen(false);
  };

  // Open 날짜 시간 선택 Modal
  const openUserAccountSelectModal = () => {
    setIsUserAccountSelectModalOpen(true);
  };

  // Close 날짜 시간 선택 Modal
  const closeUserAccountSelectModal = () => {
    setIsUserAccountSelectModalOpen(false);
  };

  /**
   * 주소록(모달폼) 주소선택 후 callback
   * @param {주소록 선택 리턴값} retVal
   */
  const callbackModal = (retVal) => {
    console.log("retVal >> ", retVal);
    if (retVal) {
      setAddressInput(retVal, modalStartEnd);

      //bookmark 정보
      setValue(`${modalStartEnd}CompanyName`, retVal["bookmarkName"]);
      setValue(`${modalStartEnd}AreaPhone`, retVal["areaPhone"]);
    }

    closeModal();
  };

  /**
   * 주소 검색(모달폼) 주소선택 후 callback
   * @param {주소록 선택 리턴값} retVal
   */
  const callbackAddressModal = (retVal) => {
    console.log("retVal >> ", retVal);
    if (retVal) {
      setAddressInput(retVal, modalStartEnd);
    }

    closeAddressModal();
  };

  /**
   * (예약설정)상하차일시 선택(모달폼) 일시 선택 후 callback
   * @param {주소록 선택 리턴값} retVal
   */
  const callbackResvTimeModal = (retVal) => {
    console.log("retVal >> ", retVal);
    if (retVal) {
      Object.keys(retVal).forEach((key) => {
        setValue(key, retVal[key]);
      });
    }

    setPlanTimeStatement(getTimeState());
    closeResvTimesModal();
  };

  /**
   * (예약설정)상하차일시 선택(모달폼) 일시 선택 후 callback
   * @param {주소록 선택 리턴값} retVal
   */
  const callbackTodayTimeModal = (retVal) => {
    console.log("retVal >> ", retVal);
    if (retVal) {
      Object.keys(retVal).forEach((key) => {
        setValue(key, retVal[key]);
      });
    }

    setPlanTimeStatement(getTimeState());
    closeTodayTimesModal();
  };

  /**
   * 계정선택 모달 callback
   * @param {계정 선택 리턴값} retVal
   */
  const callbackUserAccountSelectModal = (retVal) => {
    console.log("retVal >> ", retVal);
    if (retVal) {
      Object.keys(retVal).forEach((key) => {
        setValue("create_user", retVal);
      });
    }
    closeUserAccountSelectModal();
  };

  const initializeTimeFields = () => {
    let result = "";

    const setNullValues = () => {
      setValue("startPlanDt", null);
      setValue("startPlanHour", null);
      setValue("startPlanMinute", null);
      setValue("endPlanDt", null);
      setValue("endPlanHour", null);
      setValue("endPlanMinute", null);
    };

    if (
      getValues(["startPlanDt", "startPlanHour", "startPlanMinute"]).join("")
        .length == 12
    ) {
      setNullValues();

      // 시간 설정
      setValue("startPlanHour", getNextHourHH(1));
      setValue("startPlanMinute", "00");
      setValue("endPlanHour", getNextHourHH(2));
      setValue("endPlanMinute", "00");

      // 예약 여부
      const isResv = getValues("startPlanDt") > getDayYYYYMMDD();

      // 예약이 아닌 경우 낼착 여부
      const isEndTomm = !isResv && getValues("endPlanDt") == getDayYYYYMMDD(1);

      // 지금/당일 상차여부 체크
      const isNowHour = getValues("startPlanHour") <= getNextHourHH(1);

      // 날짜 시간 양식 만들기
      const timeStatement = `${formatDate(
        getValues("startPlanDt")
      )} ${convertTo12HourFormat(getValues("startPlanHour"))} ${getValues(
        "startPlanMinute"
      )}분`;

      // 예약 상하차인 경우
      if (isResv) {
        const isEndToday = getValues("startPlanDt") == getValues("endPlanDt");
        const endTimeStatement = isEndToday
          ? `당착 ${convertTo12HourFormat(getValues("endPlanHour"))}`
          : `낼착 ${convertTo12HourFormat(getValues("endPlanHour"))}`;
        result = `예약 (${timeStatement}) 상차 / ${endTimeStatement}`;
      } else {
        const endStatement = isEndTomm
          ? `낼착${convertTo12HourFormat(getValues("endPlanHour"))}`
          : "당착";

        // 지금 상차인 경우
        if (isNowHour) {
          result = `지금 상차 / ${endStatement}`;
        } else {
          result = `${convertTo12HourFormat(
            getValues("startPlanHour")
          )} / ${endStatement}`;
        }
      }
    } else {
      setNullValues();
    }

    return result;
  };

  //상하차 일시 display
  const getTimeState = () => {
    let result = "";

    if (
      getValues(["startPlanDt", "startPlanHour", "startPlanMinute"]).join("")
        .length == 12
    ) {
      //예약여부
      const isResv = getValues("startPlanDt") > getDayYYYYMMDD();

      //예약이 아닌 경우 낼착 여부
      const isEndTomm = !isResv && getValues("endPlanDt") == getDayYYYYMMDD(1);

      //지금/당일 상차여부 체크
      const isNowHour = getValues("startPlanHour") <= getNextHourHH(1);

      //날짜 시간 양식 만들기
      const timeStatement = `${formatDate(
        getValues("startPlanDt")
      )} ${convertTo12HourFormat(getValues("startPlanHour"))} ${getValues(
        "startPlanMinute"
      )}분`;

      //예약 상하차인 경우
      if (isResv) {
        const isEndToday = getValues("startPlanDt") == getValues("endPlanDt");

        const endTimeStatement = isEndToday
          ? `당착 ${convertTo12HourFormat(getValues("endPlanHour"))}` // 추가된 부분
          : `낼착 ${convertTo12HourFormat(getValues("endPlanHour"))}`;
        result = `예약 (${timeStatement}) 상차 / ${endTimeStatement}`;
      } else {
        const endStatement = isEndTomm
          ? `낼착${convertTo12HourFormat(getValues("endPlanHour"))}`
          : "당착";

        //지금 상차인 경우
        if (isNowHour) {
          result = `지금 상차 / ${endStatement}`;
          //당일 상차인 경우
        } else {
          result = `${convertTo12HourFormat(
            getValues("startPlanHour")
          )} / ${endStatement}`;
        }
      }
    }

    return result;
  };

  /**
   * 주소검색/주소록에서 선택한 주소 리턴값 세팅
   * @param {선택 주소 object} address
   * @param {상하차 구분} startEnd
   */
  const setAddressInput = (address, startEnd) => {
    console.log("modalStartEnd >> ", startEnd);

    let addressObj = {};
    addressObj[`${startEnd}Wide`] = address["wide"];
    addressObj[`${startEnd}Sgg`] = address["sgg"];
    addressObj[`${startEnd}Dong`] = address["dong"];

    setValue(`${startEnd}Detail`, address["detail"]);

    console.log("addressObj >> ", addressObj);
    if (startEnd === "start") {
      setStartAddressData(addressObj);
      startBaseYn = address.baseYn;
    } else {
      setEndAddressData(addressObj);
      endBaseYn = address.baseYn;
    }
  };

  /**
   * 모달 폼 디자인
   */
  const customModalStyles = {
    content: {
      top: "50%",
      left: "50%",
      height: "70%",
      borderRadius: "10px",
      transform: "translate(-50%, -50%)",
      boxShadow: "0px 0px 10px #e2e2e2",
    },
  };

  const MobileStyles = {
    // 모바일 스타일
    content: {
      ...customModalStyles.content,
      width: "90%",
    },
  };

  const DesktopStyles = {
    // 데스크탑 스타일
    content: {
      ...customModalStyles.content,
      width: "510px",
      minWidth: "fit-content",
    },
  };

  return (
    <div className="p-5 lg:pt-0 lg:p-3">
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Modal"
        style={isMobile ? MobileStyles : DesktopStyles}
      >
        <UserBookmarkModal
          onCancel={closeModal}
          onComplete={callbackModal}
          startEnd={modalStartEnd}
        />
      </Modal>
      <Modal
        isOpen={isAddressModalOpen}
        onRequestClose={closeAddressModal}
        contentLabel="Modal"
        style={isMobile ? MobileStyles : DesktopStyles}
      >
        <SearchAddressModal
          onCancel={closeAddressModal}
          onComplete={callbackAddressModal}
        />
      </Modal>
      <Modal
        isOpen={isResvTimeModalOpen}
        onRequestClose={closeResvTimesModal}
        contentLabel="Modal"
        style={isMobile ? MobileStyles : DesktopStyles}
      >
        <DateTimeSelectModal
          onCancel={closeResvTimesModal}
          onComplete={callbackResvTimeModal}
          paramObj={modalResvDateTime}
        />
      </Modal>
      <Modal
        isOpen={isTodayTimeModalOpen}
        onRequestClose={closeTodayTimesModal}
        contentLabel="Modal"
        style={isMobile ? MobileStyles : DesktopStyles}
      >
        <TodayTimeSelectModal
          onCancel={closeTodayTimesModal}
          onComplete={callbackTodayTimeModal}
          paramObj={modalTodayDateTime}
        />
      </Modal>
      <Modal
        isOpen={isUserAccountSelectModalOpen}
        onRequestClose={closeUserAccountSelectModal}
        contentLabel="Modal"
        style={isMobile ? MobileStyles : DesktopStyles}
      >
        <UserAccountSelectModal
          onCancel={closeUserAccountSelectModal}
          onComplete={callbackUserAccountSelectModal}
        />
      </Modal>
      <form onSubmit={handleSubmit(onValid, oninvalid)}>
        {isMobile ? (
          <div className="pb-12 grid gap-x-5 md:hidden">
            <div className="border-b border-gray-900/10 relative p-3 mb-5 rounded-md shadow-lg pt-8 border border-gray-300 lg:row-span-2 font-NotoSansKRMedium bg-subBgColor5">
              <div className="absolute top-0 left-0 w-full bg-mainColor2 rounded-t-md">
                <h2 className="text-base font-semibold leading-5 text-white py-2 shadow-md text-center">
                  상하차지 정보
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-y-2 mt-5">
                <div className="flex gap-x-3">
                  <div
                    onClick={() => {
                      //searchAddress("start"); //팝업방식
                      handleAddressSearchButton("start"); //레이어 모달 방식
                    }}
                    className="w-full text-right items-center gap-x-5 relative"
                  >
                    <input
                      type="text"
                      placeholder="상차지 주소(시군구동)"
                      readOnly={true}
                      value={getValues([
                        "startWide",
                        "startSgg",
                        "startDong",
                      ]).join(" ")}
                      className="block w-full flex-grow-0 rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    />
                    {getValues(["startWide", "startSgg", "startDong"])
                      .join(" ")
                      .trim() === "" ? (
                      <div className="flex items-center text-sm min-w-fit gap-x-1 cursor-pointer font-semibold text-gray-300 hover:font-extralight absolute right-2 top-3">
                        <span>주소검색</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                          />
                        </svg>
                      </div>
                    ) : null}
                  </div>
                  <button
                    className="min-w-fit rounded-md bg-white px-3 py-1 text-sm font-semibold text-gray-500 shadow-md border"
                    onClick={(e) => {
                      handleAddressButton(e, "start");
                    }}
                  >
                    주소록
                  </button>
                </div>
                <div className="my-5 hidden">
                  <Controller
                    control={control}
                    name="startAddress"
                    rules={{ required: "상차지 주소를 입력해주세요." }}
                    render={() => (
                      <AddressForm
                        addressChange={(returnValue) => {
                          const { startWide, startSgg, startDong } =
                            returnValue;
                          setValue("startWide", startWide);
                          setValue("startSgg", startSgg);
                          setValue("startDong", startDong);

                          if (
                            (startWide || "" != "") &&
                            (startSgg || "" != "") &&
                            (startDong || "" != "")
                          ) {
                            setValue("startAddress", returnValue);
                          }
                          clearErrors();
                          //console.log(returnValue);
                        }}
                        addressValue={startAddressData}
                        clsf="start"
                      />
                    )}
                  />
                </div>
                <div>
                  <input
                    {...register(`startDetail`, {
                      required: "상세주소를 입력해주세요.",
                    })}
                    type="text"
                    placeholder="상차지 상세주소"
                    className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  />

                  <div className="text-red-500 mx-auto font-bold text-center">
                    {(errors.startAddress || errors.startDetail)?.message}
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-y-2">
                <div>
                  <select
                    {...register("startLoad", {
                      required: `상차방법을 입력해주세요`,
                    })}
                    className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  >
                    <option value="">상차방법</option>
                    {LOAD_TYPE_LIST.map((item, i) => (
                      <option key={i} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <div className="text-red-500 mx-auto font-bold text-center">
                    {errors.startLoad?.message}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 justify-stretch">
                  <div>
                    <input
                      {...register("startCompanyName", {
                        required: "상차지 업체명을 입력해주세요.",
                      })}
                      type="text"
                      placeholder={"상차지 업체명"}
                      className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    />
                    <div className="text-red-500 mx-auto font-bold text-center">
                      {errors.startCompanyName?.message}
                    </div>
                  </div>
                  <div>
                    <input
                      {...register("startAreaPhone", {
                        required: "상차지 전화번호를 입력해주세요.",
                      })}
                      type="tel"
                      maxLength={14}
                      placeholder={"상차지 전화번호"}
                      className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    />
                    <div className="text-red-500 mx-auto font-bold text-center">
                      {errors.startAreaPhone?.message}
                    </div>
                  </div>
                </div>
              </div>
              {/* </div>

          <div className="border-b border-gray-900/10 relative p-3 mb-5 rounded-md shadow-lg pt-8 border border-gray-300">
            <div className="absolute top-0 left-0 w-full bg-mainColor2 rounded-t-md">
              <h2 className="text-base font-semibold leading-5 text-white py-2 shadow-md text-center">
                도착지 정보
              </h2>
            </div> */}
              <div className="text-center py-2 flex justify-center text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M20.03 4.72a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 11.69l6.97-6.97a.75.75 0 011.06 0zm0 6a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 111.06-1.06L12 17.69l6.97-6.97a.75.75 0 011.06 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="grid grid-cols-1 gap-y-2">
                <div className="flex gap-x-3">
                  <div
                    onClick={() => {
                      //searchAddress("end"); //팝업방식
                      handleAddressSearchButton("end"); //레이어 모달 방식
                    }}
                    className="w-full text-right items-center gap-x-5 relative"
                  >
                    <input
                      type="text"
                      placeholder="하차지 주소(시군구동)"
                      readOnly={true}
                      value={getValues(["endWide", "endSgg", "endDong"]).join(
                        " "
                      )}
                      className="block w-full flex-grow-0 rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    />
                    {getValues(["endWide", "endSgg", "endDong"])
                      .join(" ")
                      .trim() === "" ? (
                      <div className="flex items-center text-sm min-w-fit gap-x-1 cursor-pointer font-semibold text-gray-300 hover:font-extralight absolute right-2 top-3">
                        <span>주소검색</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                          />
                        </svg>
                      </div>
                    ) : null}
                  </div>
                  <button
                    className="min-w-fit rounded-md bg-white px-3 py-1 text-sm font-semibold text-gray-500 shadow-md border"
                    onClick={(e) => {
                      handleAddressButton(e, "end");
                    }}
                  >
                    주소록
                  </button>
                </div>

                <div className="mb-5 hidden">
                  <Controller
                    control={control}
                    name="endAddress"
                    rules={{ required: "하차지 주소를 입력해주세요." }}
                    render={() => (
                      <AddressForm
                        addressChange={(returnValue) => {
                          const { endWide, endSgg, endDong } = returnValue;
                          setValue("endWide", endWide);
                          setValue("endSgg", endSgg);
                          setValue("endDong", endDong);

                          if (
                            (endWide || "" != "") &&
                            (endSgg || "" != "") &&
                            (endDong || "" != "")
                          ) {
                            setValue("endAddress", returnValue);
                          }
                          //console.log(returnValue);
                          clearErrors();
                        }}
                        addressValue={endAddressData}
                        clsf="end"
                      />
                    )}
                  />
                </div>
                <div>
                  <input
                    {...register(`endDetail`, {
                      required: "상세주소를 입력해주세요.",
                    })}
                    type="text"
                    placeholder="하차지 상세주소"
                    className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  />
                  <div className="text-red-500 mx-auto font-bold text-center">
                    {(errors.endAddress || errors.endDetail)?.message}
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-y-2">
                <div>
                  <select
                    {...register("endLoad", {
                      required: `하차방법을 입력해주세요`,
                    })}
                    className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  >
                    <option value="">하차방법</option>
                    {LOAD_TYPE_LIST.map((item, i) => (
                      <option key={i} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <div className="text-red-500 mx-auto font-bold text-center">
                    {errors.endLoad?.message}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 justify-stretch">
                  <div>
                    <input
                      {...register("endCompanyName", {
                        required: "하차지 업체명을 입력해주세요.",
                      })}
                      type="text"
                      placeholder={"하차지 업체명"}
                      className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    />
                    <div className="text-red-500 mx-auto font-bold text-center">
                      {errors.endCompanyName?.message}
                    </div>
                  </div>
                  <div>
                    <input
                      {...register("endAreaPhone", {
                        required: "하차지 전화번호를 입력해주세요.",
                      })}
                      type="tel"
                      maxLength={14}
                      placeholder={"하차지 전화번호"}
                      className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    />
                    <div className="text-red-500 mx-auto font-bold text-center">
                      {errors.endAreaPhone?.message}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-b border-gray-900/10 relative p-3 mb-5 rounded-md shadow-lg2 pt-12 border border-gray-300 font-NotoSansKRMedium bg-subBgColor5">
              <div className="absolute top-0 left-0 w-full bg-mainColor2 rounded-t-md">
                <h2 className="text-base font-semibold leading-5 text-white py-2 shadow-md text-center">
                  상하차 일시
                </h2>
              </div>
              <p className="bg-gray-100 text-gray-500 px-2 py-2 rounded-sm">
                {planTimeStatement}
              </p>
              <div className="mt-3 flex flex-col">
                <button
                  className="rounded-full py-2 w-full bg-white border border-gray-300 flex items-center justify-center gap-x-3 hover:bg-gray-50"
                  onClick={handleTodayTimeButton}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 top-1.5 right-2 text-gray-400"
                  >
                    <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                    <path
                      fillRule="evenodd"
                      d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>상/하차일시</span>
                </button>
              </div>
              <div className="mt-3 flex flex-col">
                <button
                  className="rounded-full py-2 w-full bg-white border border-gray-300 flex items-center justify-center gap-x-3 hover:bg-gray-50"
                  onClick={handleResvTimeButton}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 top-1.5 right-2 text-gray-400"
                  >
                    <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                    <path
                      fillRule="evenodd"
                      d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>예약설정</span>
                </button>
              </div>
              <div className="text-red-500 mx-auto font-bold text-center">
                {(!isEmpty(errors.startPlanDt) ||
                  !isEmpty(errors.startPlanHour) ||
                  !isEmpty(errors.startPlanMinute) ||
                  !isEmpty(errors.endPlanDt) ||
                  !isEmpty(errors.endPlanHour) ||
                  !isEmpty(errors.endPlanMinute)) &&
                  "상하차일시를 입력해주세요"}
              </div>
            </div>
            <div className="border-b border-gray-900/10 relative p-3 mb-5 rounded-md shadow-lg pt-8 border border-gray-300 font-NotoSansKRMedium bg-subBgColor5">
              <div className="absolute top-0 left-0 w-full bg-mainColor2 rounded-t-md">
                <h2 className="text-base font-semibold leading-5 text-white py-2 shadow-md text-center">
                  화물 정보
                </h2>
              </div>
              <div className="mt-5">
                <input
                  {...register("cargoDsc")}
                  type="text"
                  placeholder="화물상세내용(메모)"
                  className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                />
              </div>
              <div className="mt-3">
                <input
                  {...register("userMemo")}
                  type="text"
                  placeholder="사용자메모"
                  className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                />
              </div>

              <div className="mt-3">
                <fieldset>
                  <div className="grid grid-flow-col justify-stretch gap-x-2">
                    <div
                      className={
                        "flex gap-x-3 ring-1 rounded-md px-4 py-2 w-full " +
                        (watch("multiCargoGub")
                          ? "ring-2 ring-blue-600 text-blue-600"
                          : "ring-gray-300")
                      }
                      onClick={() => {
                        setValue("multiCargoGub", !getValues("multiCargoGub"));
                      }}
                    >
                      <div className="flex h-6 items-center">
                        <input
                          {...register("multiCargoGub")}
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                      </div>
                      <div className="text-sm leading-6">
                        <label className="font-medium">혼적</label>
                      </div>
                    </div>
                    {isAdmin && (
                      <div
                        className={
                          "flex gap-x-3 ring-1 rounded-md px-4 py-2 w-full " +
                          (watch("urgent")
                            ? "ring-2 ring-blue-600 text-blue-600"
                            : "ring-gray-300")
                        }
                        onClick={() => {
                          setValue("urgent", !getValues("urgent"));
                        }}
                      >
                        <div className="flex h-6 items-center">
                          <input
                            {...register("urgent")}
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          />
                        </div>
                        <div className="text-sm leading-6">
                          <label className="font-medium">긴급</label>
                        </div>
                      </div>
                    )}
                    {!isAdmin && (
                      <div
                        className={
                          "flex gap-x-3 ring-1 rounded-md px-4 py-2 w-full " +
                          (watch("farePaytype")
                            ? "ring-2 ring-blue-600 text-blue-600"
                            : "ring-gray-300")
                        }
                        onClick={() => {
                          setValue("farePaytype", !getValues("farePaytype"));
                        }}
                      >
                        <div className="flex h-6 items-center">
                          <input
                            {...register("farePaytype")}
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          />
                        </div>
                        <div className="text-sm leading-6">
                          <label htmlFor="candidates" className="font-medium">
                            착불
                          </label>
                        </div>
                      </div>
                    )}
                    <div
                      className={
                        "flex gap-x-3 ring-1 rounded-md px-4 py-2 w-full " +
                        (watch("shuttleCargoInfo")
                          ? "ring-2 ring-blue-600 text-blue-600"
                          : "ring-gray-300")
                      }
                      onClick={() => {
                        setValue(
                          "shuttleCargoInfo",
                          !getValues("shuttleCargoInfo")
                        );
                      }}
                    >
                      <div className="flex h-6 items-center">
                        <input
                          {...register("shuttleCargoInfo")}
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                      </div>
                      <div className="text-sm leading-6">
                        <label htmlFor="offers" className="font-medium">
                          왕복
                        </label>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
              <div className="mt-5">
                <div className="grid gap-y-2">
                  <div>
                    <select
                      {...register("cargoTon", {
                        required: `차량톤수(t)를 입력해주세요`,
                        onChange: () => getTruckTypeList(),
                      })}
                      className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    >
                      <option value="">차량톤수(t)</option>
                      <option key={91} value="기본">
                        기본
                      </option>
                      <option key={90} value="특송">
                        특송
                      </option>
                      {cargoTonList.map(({ nm }, i) => (
                        <option key={i} value={nm}>
                          {nm} 톤
                        </option>
                      ))}
                    </select>
                    <div className="text-red-500 mx-auto font-bold text-center">
                      {errors.cargoTon?.message}
                    </div>
                  </div>
                  <div>
                    <select
                      {...register("truckType", {
                        required: `차량종류를 입력해주세요`,
                      })}
                      className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    >
                      <option value="">차량종류</option>
                      {truckTypeList &&
                        truckTypeList.map(({ nm }, i) => (
                          <option key={i} value={nm}>
                            {nm}
                          </option>
                        ))}
                    </select>
                    <div className="text-red-500 mx-auto font-bold text-center">
                      {errors.truckType?.message}
                    </div>
                  </div>
                  {isAdmin && (
                    <div>
                      <input
                        type="number"
                        step="any"
                        placeholder="적재중량(차량톤수의 110%까지)"
                        {...register("frgton", {
                          onChange: (e) => {
                            const cargoTon =
                              getValues("cargoTon") == "특송" ||
                              getValues("cargoTon") == "기본"
                                ? 0.3
                                : Number(getValues("cargoTon"));
                            const frgTon = Number(e.target.value);
                            const maxTon = cargoTon * 1.1;
                            if (frgTon > maxTon) {
                              e.target.value = maxTon.toString();
                            }
                            if (frgTon < 0) {
                              e.target.value = "0";
                            }
                          },
                          required: "적재중량을 입력해주세요.",
                        })}
                        className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                      />
                      <div className="text-red-500 mx-auto font-bold text-center">
                        {errors.frgton?.message}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {!isAdmin && Number.parseInt(watch("fareView")) > 0 && (
                <div className="mt-5">
                  <h2 className="font-bold">
                    예상 운송료{watchShuttleCargoInfo ? " (왕복)" : " (편도)"} :{" "}
                    {addCommas(watch("fareView")) + "원"}
                  </h2>
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="p-3 mb-5 rounded-md shadow-lg border border-gray-300">
                <label className="block mb-1 font-medium">계정 선택</label>
                <input
                  {...register("create_user", {
                    required: "계정을 선택해주세요.",
                  })}
                  type="text"
                  readOnly
                  placeholder="계정을 선택하세요"
                  onClick={openUserAccountSelectModal}
                  className="w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-600"
                />
                <p className="mt-1 text-red-500 text-sm">
                  {errors.create_user?.message}
                </p>
              </div>
            )}

            {isAdmin && (
              <div className="border-b border-gray-900/10 relative p-3 mb-5 rounded-md shadow-lg pt-8 border border-gray-300">
                <div className="absolute top-0 left-0 w-full bg-mainColor2 rounded-t-md">
                  <h2 className="text-base font-semibold leading-5 text-white py-2 shadow-md text-center">
                    화주 및 의뢰 정보
                  </h2>
                </div>
                <div className="mt-5">
                  <div className="grid gap-y-2">
                    <div>
                      <select
                        {...register("firstType", {
                          required: "의뢰자 구분을 입력해주세요",
                        })}
                        className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                      >
                        <option value={""}>의뢰자 구분</option>
                        <option value={"01"}>일반화주</option>
                        <option value={"02"}>주선/운송사</option>
                      </select>
                      <div className="text-red-500 mx-auto font-bold text-center">
                        {errors.firstType?.message}
                      </div>
                    </div>
                    <div>
                      <select
                        {...register("farePaytype", {
                          required: `운송료 지불구분을 입력해주세요`,
                        })}
                        className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                      >
                        <option value="">운송료 지불구분</option>
                        {PAY_TYPE_LIST.map((item, i) => (
                          <option key={i} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                      <div className="text-red-500 mx-auto font-bold text-center">
                        {errors.farePaytype?.message}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label className="font-medium leading-6 mr-2">
                        운송료 지급 예정일
                      </label>
                      <Controller
                        control={control}
                        name="payPlanYmd"
                        rules={{ required: "운송료지급예정일을 입력해주세요." }}
                        render={({ field: { onChange } }) => (
                          <DateInput
                            onDateChange={onChange}
                            dateValue={getValues("payPlanYmd")}
                            addClass="w-36"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="grid gap-y-2">
                    <div>
                      <input
                        {...register("firstShipperNm", {
                          required: "원화주 명을 입력해주세요.",
                        })}
                        type="text"
                        placeholder="원화주 명"
                        className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                      />
                      <div className="text-red-500 mx-auto font-bold text-center">
                        {errors.firstShipperNm?.message}
                      </div>
                    </div>
                    <div>
                      <input
                        {...register("firstShipperInfo", {
                          required: "원화주 전화번호를 입력해주세요.",
                        })}
                        type="tel"
                        maxLength={14}
                        placeholder={"원화주 전화번호('-'없이 입력하세요)"}
                        className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                      />
                      <div className="text-red-500 mx-auto font-bold text-center">
                        {errors.firstShipperInfo?.message}
                      </div>
                    </div>
                    <div>
                      <input
                        {...register("firstShipperBizNo", {
                          required:
                            getValues("firstType") === "02"
                              ? "원화주 사업자번호을 입력해주세요."
                              : false,
                        })}
                        type="text"
                        maxLength={10}
                        placeholder="원화주 사업자번호(의뢰자 주선/운송사인 경우 필수)"
                        className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                      />
                      <div className="text-red-500 mx-auto font-bold text-center">
                        {errors.firstShipperBizNo?.message}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="relative flex gap-x-3">
                    <div className="flex h-6 items-center">
                      <input
                        {...register("taxbillType")}
                        disabled={watchFarePayType === "선착불"}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="text-sm leading-6">
                      <label htmlFor="candidates" className="font-medium">
                        전자세금계산서 발행여부 (선착불은 선택불가)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="relative p-5 mb-5 rounded-md shadow-lg pt-12 border border-gray-300">
                <div className="absolute top-0 left-0 w-full bg-mainColor2 rounded-t-md">
                  <h2 className="text-base font-semibold leading-5 text-white py-2 shadow-md text-center">
                    운송료 정보{watchShuttleCargoInfo ? " (왕복)" : " (편도)"}
                  </h2>
                </div>

                <div className="mt-5">
                  <div className="grid gap-y-2">
                    <div>
                      <input
                        {...register("fare")}
                        type="number"
                        maxLength={10}
                        placeholder={"운송료(관리자용)"}
                        className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <input
                        {...register("fareView")}
                        type="number"
                        maxLength={10}
                        placeholder={"운송료"}
                        className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={
              "hidden md:grid h-full text-sm " +
              (isAdmin
                ? " lg:grid-cols-4 2xl:grid-cols-5 grid-cols-3"
                : " lg:grid-cols-4 grid-cols-2")
            }
          >
            <div
              className={
                "grid h-full rounded-sm mb-16 p-5 bg-white border border-gray-300" +
                (isAdmin
                  ? " lg:grid-cols-4 grid-cols-3 col-span-4"
                  : " lg:grid-cols-3 grid-cols-2 col-span-3")
              }
            >
              <div className="lg:col-span-3 md:col-span-2 mb-5 font-NotoSansKRMedium">
                <div className="flex flex-col lg:flex-row justify-between gap-x-5 gap-y-5">
                  <div className="w-full flex flex-col gap-y-3">
                    <div className="grid grid-cols-1 gap-y-3">
                      <p className="px-3 py-1 rounded-full bg-zinc-500 text-white w-fit">
                        출발지
                      </p>
                      <div className="flex gap-x-2">
                        <Label title={"주소"} required={true} />
                        <div className="w-full flex  gap-x-2">
                          <div
                            onClick={() => {
                              //searchAddress("start"); //팝업방식
                              handleAddressSearchButton("start"); //레이어 모달 방식
                            }}
                            className="w-full text-right items-center gap-x-5 relative"
                          >
                            <input
                              type="text"
                              placeholder="상차지 주소(시군구동)"
                              readOnly={true}
                              value={getValues([
                                "startWide",
                                "startSgg",
                                "startDong",
                              ]).join(" ")}
                              className="block w-full flex-grow-0 rounded-sm border-0 px-2 pt-3.5 pb-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            />
                            {getValues(["startWide", "startSgg", "startDong"])
                              .join(" ")
                              .trim() === "" ? (
                              <div className="flex items-center text-sm min-w-fit gap-x-1 cursor-pointer font-semibold text-gray-300 hover:font-extralight absolute right-2 top-3">
                                <span>주소검색</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-6 h-6"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                  />
                                </svg>
                              </div>
                            ) : null}
                          </div>
                          <button
                            className="min-w-fit rounded-md bg-white px-3 py-1 text-sm font-semibold text-gray-500 shadow-sm hover:bg-gray-50 border"
                            onClick={(e) => {
                              handleAddressButton(e, "start");
                            }}
                          >
                            주소록
                          </button>
                        </div>
                      </div>
                      <div className="hidden">
                        <Controller
                          control={control}
                          name="startAddress"
                          rules={{ required: "상차지 주소를 입력해주세요." }}
                          render={() => (
                            <AddressForm
                              addressChange={(returnValue) => {
                                const { startWide, startSgg, startDong } =
                                  returnValue;
                                setValue("startWide", startWide);
                                setValue("startSgg", startSgg);
                                setValue("startDong", startDong);

                                if (
                                  (startWide || "" != "") &&
                                  (startSgg || "" != "") &&
                                  (startDong || "" != "")
                                ) {
                                  setValue("startAddress", returnValue);
                                }
                                clearErrors();
                                //console.log(returnValue);
                              }}
                              addressValue={startAddressData}
                              clsf="start"
                            />
                          )}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex gap-x-2 font-Noto">
                          <Label title={"상세주소"} required={true} />
                          <input
                            {...register(`startDetail`, {
                              required: "상세주소를 입력해주세요.",
                            })}
                            type="text"
                            placeholder="상차지 상세주소"
                            className="w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                          />
                        </div>
                        <div className="text-red-500 mx-auto font-bold text-center">
                          {(errors.startAddress || errors.startDetail)?.message}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-y-3">
                      <div className="flex gap-x-2">
                        <Label title={"상차방법"} required={true} />
                        <div className="flex flex-col w-full">
                          <select
                            {...register("startLoad", {
                              required: `상차방법을 입력해주세요`,
                            })}
                            className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                          >
                            <option value="">상차방법</option>
                            {LOAD_TYPE_LIST.map((item, i) => (
                              <option key={i} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.startLoad?.message}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 justify-stretch">
                        <div className="flex flex-col">
                          <div className="flex w-full gap-x-2">
                            <Label title={"업체명"} required={true} />
                            <input
                              {...register("startCompanyName", {
                                required: "상차지 업체명을 입력해주세요.",
                              })}
                              type="text"
                              placeholder={"상차지 업체명"}
                              className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            />
                          </div>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.startCompanyName?.message}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex w-full gap-x-2">
                            <Label title={"연락처"} required={true} />
                            <input
                              {...register("startAreaPhone", {
                                required: "상차지 전화번호를 입력해주세요.",
                              })}
                              type="tel"
                              maxLength={14}
                              placeholder={"상차지 전화번호"}
                              className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            />
                          </div>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.startAreaPhone?.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full flex flex-col gap-y-3">
                    <div className="grid grid-cols-1 gap-y-3">
                      <p className="px-3 py-1 rounded-full bg-zinc-500 text-sm text-white w-fit">
                        도착지
                      </p>
                      <div className="flex gap-x-2">
                        <Label title={"주소"} required={true} />
                        <div className="w-full flex gap-x-2">
                          <div
                            onClick={() => {
                              //searchAddress("end"); //팝업방식
                              handleAddressSearchButton("end"); //레이어 모달 방식
                            }}
                            className="w-full text-right items-center gap-x-5 relative"
                          >
                            <input
                              type="text"
                              placeholder="하차지 주소(시군구동)"
                              readOnly={true}
                              value={getValues([
                                "endWide",
                                "endSgg",
                                "endDong",
                              ]).join(" ")}
                              className="block w-full flex-grow-0 rounded-sm border-0 px-2 pt-3.5 pb-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            />
                            {getValues(["endWide", "endSgg", "endDong"])
                              .join(" ")
                              .trim() === "" ? (
                              <div className="flex items-center text-sm min-w-fit gap-x-1 cursor-pointer font-semibold text-gray-300 hover:font-extralight absolute right-2 top-3">
                                <span>주소검색</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                  className="w-6 h-6"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                  />
                                </svg>
                              </div>
                            ) : null}
                          </div>
                          <button
                            className="min-w-fit rounded-md bg-white px-3 py-1 text-sm font-semibold text-gray-500 shadow-sm hover:bg-gray-50 border"
                            onClick={(e) => {
                              handleAddressButton(e, "end");
                            }}
                          >
                            주소록
                          </button>
                        </div>
                      </div>

                      <div className="mb-5 hidden">
                        <Controller
                          control={control}
                          name="endAddress"
                          rules={{ required: "하차지 주소를 입력해주세요." }}
                          render={() => (
                            <AddressForm
                              addressChange={(returnValue) => {
                                const { endWide, endSgg, endDong } =
                                  returnValue;
                                setValue("endWide", endWide);
                                setValue("endSgg", endSgg);
                                setValue("endDong", endDong);

                                if (
                                  (endWide || "" != "") &&
                                  (endSgg || "" != "") &&
                                  (endDong || "" != "")
                                ) {
                                  setValue("endAddress", returnValue);
                                }
                                //console.log(returnValue);
                                clearErrors();
                              }}
                              addressValue={endAddressData}
                              clsf="end"
                            />
                          )}
                        />
                        <div className="text-red-500 mx-auto font-bold text-center">
                          {errors.endAddress?.message}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex gap-x-2">
                          <Label title={"상세주소"} required={true} />
                          <input
                            {...register(`endDetail`, {
                              required: "상세주소를 입력해주세요.",
                            })}
                            type="text"
                            placeholder="하차지 상세주소"
                            className="w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                          />
                        </div>
                        <div className="text-red-500 mx-auto font-bold text-center">
                          {(errors.endAddress || errors.endDetail)?.message}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-y-3">
                      <div className="flex gap-x-2">
                        <Label title={"하차방법"} required={true} />
                        <div className="flex flex-col w-full">
                          <select
                            {...register("endLoad", {
                              required: `하차방법을 입력해주세요`,
                            })}
                            className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                          >
                            <option value="">하차방법</option>
                            {LOAD_TYPE_LIST.map((item, i) => (
                              <option key={i} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.endLoad?.message}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 justify-stretch">
                        <div className="flex flex-col">
                          <div className="flex w-full gap-x-2">
                            <Label title={"업체명"} required={true} />
                            <input
                              {...register("endCompanyName", {
                                required: "하차지 업체명을 입력해주세요.",
                              })}
                              type="text"
                              placeholder={"하차지 업체명"}
                              className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            />
                          </div>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.endCompanyName?.message}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex w-full gap-x-2">
                            <Label title={"연락처"} required={true} />
                            <input
                              {...register("endAreaPhone", {
                                required: "하차지 전화번호를 입력해주세요.",
                              })}
                              type="tel"
                              maxLength={14}
                              placeholder={"하차지 전화번호"}
                              className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            />
                          </div>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.endAreaPhone?.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 justify-between gap-x-5 gap-y-5 mt-16 pt-12 border-t border-dashed border-gray-200 ">
                  <div className="flex flex-col gap-y-3">
                    <p className="px-3 py-1 rounded-full bg-zinc-500 text-white w-fit">
                      차량선택
                    </p>

                    <div className="grid grid-cols-4 gap-x-3">
                      <div
                        className={
                          "rounded-sm border px-2 pt-2 pb-7 flex flex-col items-center" +
                          (carType == "truck"
                            ? " border-mainBlue"
                            : " border-gray-200")
                        }
                        onClick={() => setCarType("truck")}
                      >
                        <img
                          src={"/cars/트럭.png"}
                          className={
                            "h-16 w-20 object-contain" +
                            (carType != "truck" ? " opacity-40" : "")
                          }
                        />
                        <div className="w-5/6 mx-auto text-center relative">
                          <p
                            className={
                              "w-full py-1 px-3 rounded-full absolute -bottom-10" +
                              (carType == "truck"
                                ? " bg-mainBlue text-white"
                                : " bg-gray-200 text-gray-400")
                            }
                          >
                            트럭
                          </p>
                        </div>
                      </div>
                      <div
                        className={
                          "rounded-sm border px-2 pt-2 pb-7 flex flex-col items-center" +
                          (carType == "labo"
                            ? " border-mainBlue"
                            : " border-gray-200")
                        }
                        onClick={() => setCarType("labo")}
                      >
                        <img
                          src={"/cars/라보.png"}
                          className={
                            "h-16 w-20 object-contain" +
                            (carType != "labo" ? " opacity-40" : "")
                          }
                        />
                        <div className="w-5/6 mx-auto text-center relative">
                          <p
                            className={
                              "w-full py-1 px-3 rounded-full absolute -bottom-10" +
                              (carType == "labo"
                                ? " bg-mainBlue text-white"
                                : " bg-gray-200 text-gray-400")
                            }
                          >
                            라보
                          </p>
                        </div>
                      </div>
                      <div
                        className={
                          "rounded-sm border px-2 pt-2 pb-7 flex flex-col items-center" +
                          (carType == "damas"
                            ? " border-mainBlue"
                            : " border-gray-200")
                        }
                        onClick={() => setCarType("damas")}
                      >
                        <img
                          src={"/cars/다마스.png"}
                          className={
                            "h-16 w-20 object-contain" +
                            (carType != "damas" ? " opacity-40" : "")
                          }
                        />
                        <div className="w-5/6 mx-auto text-center relative">
                          <p
                            className={
                              "w-full py-1 px-3 rounded-full absolute -bottom-10" +
                              (carType == "damas"
                                ? " bg-mainBlue text-white"
                                : " bg-gray-200 text-gray-400")
                            }
                          >
                            다마스
                          </p>
                        </div>
                      </div>
                      <div
                        className={
                          "rounded-sm border px-2 pt-2 pb-7 flex flex-col items-center" +
                          (carType == "motorcycle"
                            ? " border-mainBlue"
                            : " border-gray-200")
                        }
                        onClick={() => setCarType("motorcycle")}
                      >
                        <img
                          src={"/cars/오토바이 퀵.png"}
                          className="h-16 w-20 opacity-40 object-contain"
                        />
                        <div className="w-full mx-auto text-center relative">
                          <p
                            className={
                              "w-full py-1 px-3 rounded-full absolute -bottom-10" +
                              (carType == "motorcycle"
                                ? " bg-mainBlue text-white"
                                : " bg-gray-200 text-gray-400")
                            }
                          >
                            오토바이
                          </p>
                          {/* <p className="w-full py-1 px-3 text-gray-600 italic absolute -top-4">
                            준비중
                          </p> */}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <fieldset>
                        <div className="grid grid-flow-col justify-stretch gap-x-2">
                          <div
                            className={
                              "flex gap-x-3 ring-1 rounded-sm px-4 py-2 w-full " +
                              (watch("multiCargoGub")
                                ? "ring-2 ring-blue-600 text-blue-600"
                                : "ring-gray-300")
                            }
                            onClick={() => {
                              setValue(
                                "multiCargoGub",
                                !getValues("multiCargoGub")
                              );
                            }}
                          >
                            <div className="flex h-6 items-center">
                              <input
                                {...register("multiCargoGub")}
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                              />
                            </div>
                            <div className="text-sm leading-6">
                              <label className="font-medium">혼적</label>
                            </div>
                          </div>
                          {isAdmin && (
                            <div
                              className={
                                "flex gap-x-3 ring-1 rounded-sm px-4 py-2 w-full " +
                                (watch("urgent")
                                  ? "ring-2 ring-blue-600 text-blue-600"
                                  : "ring-gray-300")
                              }
                              onClick={() => {
                                setValue("urgent", !getValues("urgent"));
                              }}
                            >
                              <div className="flex h-6 items-center">
                                <input
                                  {...register("urgent")}
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                />
                              </div>
                              <div className="text-sm leading-6">
                                <label className="font-medium">긴급</label>
                              </div>
                            </div>
                          )}
                          {!isAdmin && (
                            <div
                              className={
                                "flex gap-x-3 ring-1 rounded-sm px-4 py-2 w-full " +
                                (watch("farePaytype")
                                  ? "ring-2 ring-blue-600 text-blue-600"
                                  : "ring-gray-300")
                              }
                              onClick={() => {
                                setValue(
                                  "farePaytype",
                                  !getValues("farePaytype")
                                );
                              }}
                            >
                              <div className="flex h-6 items-center">
                                <input
                                  {...register("farePaytype")}
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                />
                              </div>
                              <div className="text-sm leading-6">
                                <label className="font-medium">착불</label>
                              </div>
                            </div>
                          )}
                          <div
                            className={
                              "flex gap-x-3 ring-1 rounded-sm px-4 py-2 w-full " +
                              (watch("shuttleCargoInfo")
                                ? "ring-2 ring-blue-600 text-blue-600"
                                : "ring-gray-300")
                            }
                            onClick={() => {
                              setValue(
                                "shuttleCargoInfo",
                                !getValues("shuttleCargoInfo")
                              );
                            }}
                          >
                            <div className="flex h-6 items-center">
                              <input
                                {...register("shuttleCargoInfo")}
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                              />
                            </div>
                            <div className="text-sm leading-6">
                              <label className="font-medium">왕복</label>
                            </div>
                          </div>
                          {/* 새로 추가된 알람끄기 */}
                          {/* 알람끄기 */}
                          <label
                            className={
                              "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer " +
                              (watch("muteAlert") /*이 줄을 추가*/
                                ? "border-2 border-red-600 text-red-600"
                                : "border border-gray-300 text-gray-700")
                            }
                            onClick={() =>
                              setValue("muteAlert", !getValues("muteAlert"))
                            }
                          >
                            <input
                              {...register("muteAlert")}
                              type="checkbox"
                              className="h-4 w-4"
                            />
                            <span className="font-medium">카톡끄기</span>
                          </label>
                        </div>
                      </fieldset>
                    </div>
                    <div className="">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                        <div>
                          <select
                            {...register("cargoTon", {
                              required: `차량톤수(t)를 입력해주세요`,
                              onChange: () => getTruckTypeList(),
                            })}
                            className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                          >
                            <option value="">차량톤수(t)</option>
                            {carType == "motorcycle"
                              ? ["특송", "기본"].map((item) => {
                                  return <option value={item}>{item}</option>;
                                })
                              : cargoTonList.map(({ nm }, i) => {
                                  if (carType == "truck") {
                                    if (["0.3", "0.5"].includes(nm)) {
                                      return;
                                    }
                                  } else {
                                    if (nm != "0.5") {
                                      return;
                                    }
                                  }

                                  return (
                                    <option key={i} value={nm}>
                                      {nm} 톤
                                    </option>
                                  );
                                })}
                          </select>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.cargoTon?.message}
                          </div>
                        </div>
                        <div>
                          <select
                            {...register("truckType", {
                              required: `차량종류를 입력해주세요`,
                            })}
                            className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                          >
                            <option value="">차량종류</option>
                            {truckTypeList &&
                              truckTypeList.map(({ nm }, i) => (
                                <option key={i} value={nm}>
                                  {nm}
                                </option>
                              ))}
                          </select>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.truckType?.message}
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="col-span-2">
                            <div className="flex gap-x-2">
                              <Label title={"적재중량"} />
                              <input
                                type="number"
                                step="any"
                                placeholder="차량톤수의 110%까지"
                                {...register("frgton", {
                                  onChange: (e) => {
                                    const cargoTon =
                                      getValues("cargoTon") == "특송" ||
                                      getValues("cargoTon") == "기본"
                                        ? 0.3
                                        : Number(getValues("cargoTon"));
                                    const frgTon = Number(e.target.value);
                                    const maxTon = cargoTon * 1.1;
                                    if (frgTon > maxTon) {
                                      e.target.value = maxTon.toString();
                                    }
                                    if (frgTon < 0) {
                                      e.target.value = "0";
                                    }
                                  },
                                  required: "적재중량을 입력해주세요.",
                                })}
                                className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                              />
                            </div>
                            <div className="text-red-500 mx-auto font-bold text-center">
                              {errors.frgton?.message}
                            </div>
                          </div>
                        )}
                        <div className="col-span-2">
                          <textarea
                            {...register("userMemo")}
                            placeholder="사용자 메모"
                            rows="1"
                            className="block w-full rounded-sm border-0 px-2 py-2.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                    {!isAdmin && Number.parseInt(watch("fareView")) > 0 && (
                      <div className="mt-5">
                        <h2 className="font-bold">
                          예상 운송료
                          {watchShuttleCargoInfo ? " (왕복)" : " (편도)"} :{" "}
                          {addCommas(watch("fareView")) + "원"}
                        </h2>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-y-3">
                    <p className="px-3 py-1 rounded-full bg-zinc-500 text-white w-fit">
                      상하차일시 / 메모
                    </p>
                    <p className="bg-gray-100 text-gray-500 px-2 py-2 rounded-sm">
                      {planTimeStatement}
                    </p>
                    <div className="grid grid-cols-2 gap-x-3">
                      <div className="flex flex-col">
                        <button
                          className="rounded-full py-3 w-full bg-white border border-gray-300 flex items-center justify-center gap-x-3 hover:bg-gray-50"
                          onClick={handleTodayTimeButton}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-6 h-6 top-1.5 right-2 text-gray-400"
                          >
                            <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                            <path
                              fillRule="evenodd"
                              d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>상/하차일시</span>
                        </button>
                        <div className="text-red-500 mx-auto font-bold text-center">
                          {(!isEmpty(errors.startPlanDt) ||
                            !isEmpty(errors.startPlanHour) ||
                            !isEmpty(errors.startPlanMinute)) &&
                            "상차일시를 입력해주세요"}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <button
                          className="rounded-full py-3 w-full bg-white border border-gray-300 flex items-center justify-center gap-x-3 hover:bg-gray-50"
                          onClick={handleResvTimeButton}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-6 h-6 top-1.5 right-2 text-gray-400"
                          >
                            <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                            <path
                              fillRule="evenodd"
                              d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>예약설정</span>
                        </button>
                      </div>
                    </div>
                    <div className="text-red-500 mx-auto font-bold text-center">
                      {(!isEmpty(errors.startPlanDt) ||
                        !isEmpty(errors.startPlanHour) ||
                        !isEmpty(errors.startPlanMinute) ||
                        !isEmpty(errors.endPlanDt) ||
                        !isEmpty(errors.endPlanHour) ||
                        !isEmpty(errors.endPlanMinute)) &&
                        "상하차일시를 입력해주세요"}
                    </div>

                    <div className="">
                      <textarea
                        {...register("cargoDsc")}
                        placeholder="화물상세내용(메모)"
                        rows="7"
                        className="block w-full rounded-sm border-0 px-2 py-2.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="ml-5 pl-5 pb-5 mb-5 border-l border-dashed border-gray-200">
                  <div className="">
                    <div className="w-full border-b border-gray-200 mb-2">
                      <h2 className="text-base font-semibold py-1">
                        계정 정보
                      </h2>
                    </div>

                    <div className="">
                      <div className="grid gap-y-2">
                        <div className="flex gap-x-2">
                          <Label title={"계정"} required={true} />
                          <input
                            {...register("create_user")}
                            type="text"
                            readOnly={true}
                            onClick={openUserAccountSelectModal}
                            className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-dashed border-gray-200">
                    <div className="w-full border-b border-gray-200 mb-2">
                      <h2 className="text-base font-semibold py-1">
                        운송료 정보
                        {watchShuttleCargoInfo ? " (왕복)" : " (편도)"}
                      </h2>
                    </div>

                    <div className="">
                      <div className="grid gap-y-2">
                        <div className="flex gap-x-2">
                          <Label title={"운송료"} />
                          <input
                            {...register("fareView")}
                            type="number"
                            maxLength={10}
                            className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                          />
                        </div>
                        <div className="flex gap-x-2">
                          <Label title={"관리자용"} />
                          <input
                            {...register("fare")}
                            type="number"
                            maxLength={10}
                            className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-dashed border-gray-200">
                    <div className="w-full border-b border-gray-200 mb-2">
                      <h2 className="text-base font-semibold py-1">
                        화주 및 의뢰 정보
                      </h2>
                    </div>
                    <div className="">
                      <div className="grid gap-y-3">
                        <div>
                          <div className="flex gap-x-2">
                            <Label title={"의뢰자구분"} required={true} />
                            <select
                              {...register("firstType", {
                                required: "의뢰자 구분을 입력해주세요",
                              })}
                              className="block w-full rounded-sm border-0 p-2 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            >
                              <option value={"01"}>일반화주</option>
                              <option value={"02"}>주선/운송사</option>
                            </select>
                          </div>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.firstType?.message}
                          </div>
                        </div>
                        <div>
                          <div className="flex gap-x-2">
                            <Label title={"지불구분"} required={true} />
                            <select
                              {...register("farePaytype", {
                                required: `운송료 지불구분을 입력해주세요`,
                              })}
                              defaultValue="인수증"
                              className="block w-full rounded-sm border-0 p-2 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            >
                              <option value="">운송료 지불구분</option>
                              {PAY_TYPE_LIST.map((item, i) => (
                                <option key={i} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.farePaytype?.message}
                          </div>
                        </div>
                        <div className="flex gap-x-2">
                          <Label title={"지급예정일"} required={true} />

                          <Controller
                            control={control}
                            name="payPlanYmd"
                            rules={{
                              required: "운송료지급예정일을 입력해주세요.",
                            }}
                            render={() => (
                              <DateInput
                                onDateChange={(returnVal) =>
                                  setValue("payPlanYmd", returnVal)
                                }
                                dateValue={getValues("payPlanYmd")}
                                addClass="w-full"
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-5">
                      <div className="grid gap-y-3">
                        <div>
                          <div className="flex gap-x-2">
                            <Label title={"원화주명"} required={true} />
                            <input
                              defaultValue="00000000"
                              {...register("firstShipperNm", {
                                required: "원화주 명을 입력해주세요.",
                              })}
                              type="text"
                              placeholder="원화주 명"
                              className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            />
                          </div>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.firstShipperNm?.message}
                          </div>
                        </div>
                        <div>
                          <div className="flex gap-x-2">
                            <Label title={"전화번호"} required={true} />
                            <input
                              defaultValue="00000000"
                              {...register("firstShipperInfo", {
                                required: "원화주 전화번호를 입력해주세요.",
                              })}
                              type="tel"
                              maxLength={14}
                              placeholder={"원화주 전화번호('-'없이)"}
                              className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            />
                          </div>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.firstShipperInfo?.message}
                          </div>
                        </div>
                        <div>
                          <div className="flex gap-x-2">
                            <Label title={"사업자번호"} required={true} />
                            <input
                              defaultValue="000000"
                              {...register("firstShipperBizNo", {
                                required:
                                  getValues("firstType") === "02"
                                    ? "원화주 사업자번호을 입력해주세요."
                                    : false,
                              })}
                              type="text"
                              maxLength={10}
                              placeholder="원화주 사업자번호"
                              className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            />
                          </div>
                          <div className="text-red-500 mx-auto font-bold text-center">
                            {errors.firstShipperBizNo?.message}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5">
                      <div
                        className={
                          "flex gap-x-3 ring-1 rounded-sm px-4 py-2 w-full " +
                          (watch("taxbillType")
                            ? "ring-2 ring-blue-600 text-blue-600"
                            : "ring-gray-300")
                        }
                        onClick={() => {
                          if (watchFarePayType == "선착불") return;
                          setValue("taxbillType", !getValues("taxbillType"));
                        }}
                      >
                        <div className="flex h-6 items-center">
                          <input
                            {...register("taxbillType")}
                            disabled={watchFarePayType === "선착불"}
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          />
                        </div>
                        <div className="text-sm leading-6">
                          <label className="font-medium">
                            <p>전자세금계산서 발행여부</p>
                            <p
                              className={
                                watchFarePayType === "선착불" ? "" : "hidden"
                              }
                            >
                              (선착불은 선택불가)
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div
              className={
                "hidden flex-col p-5 bg-subBgColor3 text-black border border-gray-300 rounded-sm ml-5 font-NotoSansKRMedium row-span-2colo" +
                (isAdmin ? " 2xl:flex" : " lg:flex")
              }
            >
              <div className="w-full border-b border-black font-NotoSansKRMedium">
                <h2 className="text-base font-semibold py-7">배차 목록</h2>
              </div>
              <ul>
                {recentCargoList &&
                  recentCargoList.map(
                    (
                      {
                        startWide, //상차지 시/도
                        startSgg, //상차지 구/군
                        startDong, //상차지 읍/면/동
                        startDetail,
                        endWide, //하차지 시/도
                        endSgg, //하차지 구/군
                        endDong, //하차지 읍/면/동
                        endDetail,
                        multiCargoGub, //혼적여부("혼적")
                        urgent, //긴급여부("긴급")
                        shuttleCargoInfo, //왕복여부("왕복")
                        truckType, //차량종류
                        cargoTon,
                        startPlanDt, //상차일("YYYYMMDD")
                      },
                      i
                    ) => (
                      <li key={i} onClick={() => selectCargoOrder(i)}>
                        <div className="py-5 border-b border-gray-300 flex flex-col cursor-pointer">
                          <div className="mb-3 flex items-center gap-x-5">
                            <span className="">{formatDate(startPlanDt)}</span>
                            <div className="flex items-center gap-x-3">
                              <p className="px-0.5 rounded-md shadow-md bg-gray-500 text-sm text-white">
                                {`${cargoTon}t ${truckType}`}
                              </p>
                              {urgent && (
                                <p className="px-0.5 rounded-md shadow-md bg-red-400 text-sm text-white">
                                  {urgent}
                                </p>
                              )}
                              {multiCargoGub && (
                                <p className="px-0.5 rounded-md shadow-md bg-indigo-400 text-sm text-white">
                                  {multiCargoGub}
                                </p>
                              )}
                              {shuttleCargoInfo && (
                                <p className="px-0.5 rounded-md bg-yellow-400 text-sm text-white">
                                  {shuttleCargoInfo}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="">
                            <p className="mt-1 truncate leading-5 text-gray-500 whitespace-pre-wrap">
                              {`상차지 : ${startWide} ${startSgg} ${startDong} ${startDetail}`}
                            </p>
                          </div>
                          <div className="">
                            <p className="mt-1 truncate leading-5 text-gray-500 whitespace-pre-wrap">
                              {`하차지 : ${endWide} ${endSgg} ${endDong} ${endDetail}`}
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  )}
              </ul>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 p-3 w-full bg-white border shadow-md">
          <div className="flex items-center justify-end lg:gap-x-6 gap-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md md:hidden bg-normalGray px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
            >
              Cancel
            </button>
            {isDirectApi ? (
              <button
                type="submit"
                className="rounded-md bg-buttonZamboa px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
              >
                배차신청 수정
              </button>
            ) : (
              <button
                type="submit"
                className="rounded-md bg-mainColor3 md:bg-mainBlue px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
              >
                {isEdit ? "화물 수정" : "화물 등록"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
