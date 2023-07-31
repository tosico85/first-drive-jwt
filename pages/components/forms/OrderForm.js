import { Controller, useForm } from "react-hook-form";
import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";
import AddressForm from "./AddressForm";
import DateInput from "../custom/DateInput";
import { useRouter } from "next/router";
import { format } from "date-fns";
import AuthContext from "../../context/authContext";
import Modal from "react-modal";
import UserAddressModal from "../modals/UserAddressModal";
import { isEmptyObject } from "../../../utils/ObjectUtils";
import {
  addCommas,
  formatDate,
  getDayYYYYMMDD,
  isEmpty,
} from "../../../utils/StringUtils";
import SearchAddressModal from "../modals/SearchAddressModal";
import DateTimeSelectModal from "../modals/DateTimeSelectModal";
import Label from "../custom/Label";

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
  const [isSelectTimeModalOpen, setIsSelectTimeModalOpen] = useState(false);
  const [modalStartEnd, setModalStartEnd] = useState("");
  const [modalDateTime, setModalDateTime] = useState({});

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
  const methods = useForm({ mode: "onSubmit" });
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

        const curDt = format(new Date(), "yyyyMMdd");
        setValue("startPlanDt", getValues("startPlanDt") || curDt);
        setValue("endPlanDt", getValues("endPlanDt") || curDt);
        setValue("payPlanYmd", getValues("payPlanYmd") || curDt);

        if (isEdit || isCopy) {
          console.log("EditData >> ", editData);
          await loadParamData();
        } else {
          console.log("Prefill ..");
          prefillBaseAddress();
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
  }, [watchCargoTon, watchShuttleCargoInfo]);

  // 운행요금 조회 시 차량톤수에 따른 운행료 세팅
  useEffect(() => {
    const cargoTon = getValues("cargoTon");

    //차량 톤수가 선택된 경우
    if (!isEmpty(cargoTon) && !isEmptyObject(fareMap)) {
      setFareByCargoTon(cargoTon);
    }

    console.log("result >> ", fareMap);
  }, [fareMap]);

  //상하차지 변경에 따른 운행요금 조회
  const setFareByDistance = async (params) => {
    const result = await requestServer(apiPaths.commonGetFare, params);
    setFareMap(result);
  };

  // 차량 톤수에 대한 운행료 계산
  const setFareByCargoTon = (cargoTon) => {
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
        // 5톤축? 뭔지 모름
        //setValue("fareView", fiveTonPlus);
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

  // TEST DATA 로드
  const loadParamData = async () => {
    setValue("cargoTon", editData["cargoTon"] || "");

    if (editData["cargoTon"]) {
      await getTruckTypeList();
      Object.keys(editData).forEach((key) => {
        if (
          [
            "taxbillType",
            "multiCargoGub",
            "urgent",
            "shuttleCargoInfo",
          ].includes(key)
        ) {
          setValue(key, (editData[key] || "") != "");
        } else {
          setValue(key, editData[key]);
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
    };

    let result = await requestServer(url, params);
    if (result) {
      if (result.length > 10) {
        result = result.slice(0, 10);
      }
      setRecentCargoList(() => result);
      console.log("Cargo order >>", result);
    }
  };

  // 배차목록 선택 시 화물오더 load
  const selectCargoOrder = async (index) => {
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
        ordNo,
        startPlanDt,
        startPlanHour,
        startPlanMinute,
        endPlanDt,
        endPlanHour,
        endPlanMinute,
        payPlanYmd,
        create_dtm,
        delete_yn,
        ...rest
      }) => rest)(targetOrder);

      editData = { ...paramData };
      await loadParamData();
    }
  };

  // 차량톤수 조회(콤보박스 셋팅용)
  const getTruckTypeList = async () => {
    const cargoTon = getValues("cargoTon");
    setTruckTypeList([]);

    if (cargoTon !== "") {
      const { code, data } = await requestServer(apiPaths.apiOrderTruckType, {
        cargoTon,
      });
      if (code === 1) {
        setTruckTypeList(data);
      }
    }
  };

  // 상하차지 기본주소 프리필
  const prefillBaseAddress = async () => {
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
  };

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
    ].forEach((item) => {
      object[item.key] = object[item.key] ? item.value : "";
    });

    // 운송료지불구분의 경우 화주는 체크박스로 제공
    if (!isAdmin) {
      object["farePaytype"] = object["farePaytype"] ? "선착불" : "";
    }

    return object;
  };

  // 상하차지 주소정보 update
  const regStartEndAddress = async () => {
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
  };

  /**
   * 화물 등록(화주가 화물 등록 하는 경우)
   */
  const createCargoOrder = async () => {
    const cargoOrder = (({ startAddress, endAddress, ...rest }) => rest)(
      getValues()
    );
    cargoOrder = checkboxValueReset(cargoOrder);

    // 상하차지 주소정보 update
    await regStartEndAddress();

    // 화물등록
    const { result, resultCd } = await requestServer(
      apiPaths.custReqAddCargoOrder,
      cargoOrder
    );

    if (resultCd === "00") {
      alert("화물 오더가 등록되었습니다.");
      router.push("/orders/list");
    } else {
      alert(result);
    }
  };

  /**
   * 화물 정보 update
   * - 화물 상태에 따른 호출 API를 다르게 하여 호출
   */
  const updateCargoOrder = async () => {
    const cargoOrder = (({
      ordStatus,
      startAddress,
      endAddress,
      change_dtm,
      change_user,
      ...rest
    }) => rest)(getValues());

    cargoOrder = checkboxValueReset(cargoOrder);

    console.log(cargoOrder);

    /**
     * 1. 화주가 접수상태의 화물 수정
     * 2. 관리자가 접수상태의 화물/운송료 정보 수정
     * 3. 관리자가 배차신청 상태의 화물정보 수정
     */
    const url = apiPaths.custReqModCargoOrder;
    if (isAdmin) {
      if (isDirectApi) {
        url = apiPaths.apiOrderMod;
      } else {
        url = apiPaths.adminModCargoOrder;
      }
    }

    const { result, resultCd, code, message } = await requestServer(
      url,
      cargoOrder
    );

    // API의 경우 리턴 양식이 다름
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
        console.log(getValues(`${startEnd}${time}`));
        if (isEmpty(getValues(`${startEnd}${time}`))) {
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
  const handleAddressSearchButton = (e, startEnd) => {
    e.preventDefault();
    setModalStartEnd(startEnd);
    console.log("startEnd >> ", startEnd);
    openAddressModal();
  };

  /**
   * 상하차일시 버튼 event handle
   * @param {event} e
   * @param {상하차 구분} startEnd
   */
  const handleSelectTimeButton = (e, startEnd) => {
    e.preventDefault();
    setModalStartEnd(startEnd);
    console.log("startEnd >> ", startEnd);

    let paramObj = {};
    paramObj["PlanDt"] = getValues(`${startEnd}PlanDt`) || "";
    paramObj["PlanHour"] = getValues(`${startEnd}PlanHour`) || "";
    paramObj["PlanMinute"] = getValues(`${startEnd}PlanMinute`) || "";
    setModalDateTime(paramObj);
    console.log("paramObj >> ", paramObj);

    openSelectTimeModal();
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
  const openSelectTimeModal = () => {
    setIsSelectTimeModalOpen(true);
  };

  // Close 날짜 시간 선택 Modal
  const closeSelectTimesModal = () => {
    setIsSelectTimeModalOpen(false);
  };

  /**
   * 주소록(모달폼) 주소선택 후 callback
   * @param {주소록 선택 리턴값} retVal
   */
  const callbackModal = (retVal) => {
    console.log("retVal >> ", retVal);
    if (retVal) {
      setAddressInput(retVal, modalStartEnd);
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
   * 상하차일시 선택(모달폼) 일시 선택 후 callback
   * @param {주소록 선택 리턴값} retVal
   */
  const callbackSelectTimeModal = (retVal) => {
    console.log("retVal >> ", retVal);
    if (retVal) {
      Object.keys(retVal).forEach((key) => {
        setValue(key, retVal[key]);
      });
    }

    closeSelectTimesModal();
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
      width: "40%",
      minWidth: "fit-content",
    },
  };

  /**
   * @title 주소 검색(팝업창 방식)
   * @param {상하차 구분} startEnd
   */
  /* function searchAddress(startEnd) {
    addressPopupStartEnd = startEnd;

    new daum.Postcode({
      oncomplete: function (data) {
        console.log(data);
        const { sido, sigungu, bname1, bname2, buildingName } = data;

        let convSido = sido?.substring(0, 2); //시/도는 무조건 앞 2글자
        let splitSigungu = sigungu?.split(" ");
        let convGugun = splitSigungu.shift(); //시군구의 첫번째 단어만 시/군 항목으로 사용

        //세종시 예외처리
        if (convSido == "세종") {
          convGugun = sido.substring(2); //'특별자치시'
        }

        //시군구 데이터 정제
        const pattern = /^(.*?)(시|군|구)$/;
        if (!/^(동구|남구|북구|서구|중구)$/i.test(convGugun)) {
          convGugun = convGugun.replace(pattern, "$1");
        }
        //console.log("splitSigungu", splitSigungu);

        //동 데이터 만들기. 시군구 앞단어 빼고 나머지, 법정동1, 2 합쳐서 처리
        const extraSigungu = splitSigungu.join(" ");
        let convDong = [extraSigungu, bname1, bname2]
          .join(" ")
          .replace("  ", " ")
          .trim();

        console.log("convSido", convSido);
        console.log("convGugun", convGugun);
        console.log("convDong", convDong);

        setAddressInput(
          {
            wide: convSido,
            sgg: convGugun,
            dong: convDong,
            detail: buildingName,
            baseYn: "N",
          },
          addressPopupStartEnd
        );
      },
    }).open();
  } */

  return (
    <div className="p-5 lg:pt-0 lg:p-3">
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Modal"
        style={isMobile ? MobileStyles : DesktopStyles}
      >
        <UserAddressModal
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
        isOpen={isSelectTimeModalOpen}
        onRequestClose={closeSelectTimesModal}
        contentLabel="Modal"
        style={isMobile ? MobileStyles : DesktopStyles}
      >
        <DateTimeSelectModal
          onCancel={closeSelectTimesModal}
          onComplete={callbackSelectTimeModal}
          startEnd={modalStartEnd}
          paramObj={modalDateTime}
        />
      </Modal>
      <form onSubmit={handleSubmit(onValid, oninvalid)}>
        {isMobile ? (
          <div className="pb-12 grid gap-x-5 md:hidden">
            <div className="border-b border-gray-900/10 relative p-3 mb-5 rounded-md shadow-lg pt-8 border border-gray-300 lg:row-span-2">
              <div className="absolute top-0 left-0 w-full bg-mainColor2 rounded-t-md">
                <h2 className="text-base font-semibold leading-5 text-white py-2 shadow-md text-center">
                  상하차지 정보
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-y-2 mt-5">
                <div className="flex gap-x-3">
                  <div
                    onClick={(e) => {
                      //searchAddress("start"); //팝업방식
                      handleAddressSearchButton(e, "start"); //레이어 모달 방식
                    }}
                    className="w-full text-right items-center gap-x-5 relative"
                  >
                    <input
                      type="text"
                      placeholder="상차지 주소(시군구동)"
                      disabled={true}
                      value={getValues([
                        "startWide",
                        "startSgg",
                        "startDong",
                      ]).join(" ")}
                      className="block w-full flex-grow-0 rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    />
                    <div className="flex items-center text-sm min-w-fit gap-x-1 cursor-pointer font-semibold text-gray-300 hover:font-extralight absolute right-2 top-1.5">
                      <span>주소검색</span>
                      <svg
                        xmlns="h  ttp://www.w3.org/2000/svg"
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
                    className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
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
                      className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
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
                      maxLength={11}
                      placeholder={"상차지 전화번호"}
                      className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
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
                    onClick={(e) => {
                      //searchAddress("end"); //팝업방식
                      handleAddressSearchButton(e, "end"); //레이어 모달 방식
                    }}
                    className="w-full text-right items-center gap-x-5 relative"
                  >
                    <input
                      type="text"
                      placeholder="하차지 주소(시군구동)"
                      disabled={true}
                      value={getValues(["endWide", "endSgg", "endDong"]).join(
                        " "
                      )}
                      className="block w-full flex-grow-0 rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    />
                    <div className="flex items-center text-sm min-w-fit gap-x-1 cursor-pointer font-semibold text-gray-300 hover:font-extralight absolute right-2 top-1.5">
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
                    className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
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
                      className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
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
                      maxLength={11}
                      placeholder={"하차지 전화번호"}
                      className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    />
                    <div className="text-red-500 mx-auto font-bold text-center">
                      {errors.endAreaPhone?.message}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-b border-gray-900/10 relative p-3 mb-5 rounded-md shadow-lg2 pt-12 border border-gray-300">
              <div className="absolute top-0 left-0 w-full bg-mainColor2 rounded-t-md">
                <h2 className="text-base font-semibold leading-5 text-white py-2 shadow-md text-center">
                  상하차 일시
                </h2>
              </div>
              <div className="flex flex-col">
                <button
                  className="rounded-full py-2 w-full bg-white border border-gray-300 flex items-center justify-center gap-x-3 hover:bg-gray-50"
                  onClick={(e) => handleSelectTimeButton(e, "start")}
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
                  <span>상차 일시</span>
                  <span>
                    {getValues([
                      "startPlanDt",
                      "startPlanHour",
                      "startPlanMinute",
                    ]).join("").length == 12 &&
                      ` ${formatDate(getValues("startPlanDt"))} ${getValues(
                        "startPlanHour"
                      )}:${getValues("startPlanMinute")}`}
                  </span>
                </button>
                <div className="text-red-500 mx-auto font-bold text-center">
                  {(!isEmpty(errors.startPlanDt) ||
                    !isEmpty(errors.startPlanHour) ||
                    !isEmpty(errors.startPlanMinute)) &&
                    "상차일시를 입력해주세요"}
                </div>
              </div>
              <div className="mt-3 flex flex-col">
                <button
                  className="rounded-full py-2 w-full bg-white border border-gray-300 flex items-center justify-center gap-x-3 hover:bg-gray-50"
                  onClick={(e) => handleSelectTimeButton(e, "end")}
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
                  <span>하차 일시</span>
                  <span>
                    {getValues([
                      "endPlanDt",
                      "endPlanHour",
                      "endPlanMinute",
                    ]).join("").length == 12 &&
                      ` ${formatDate(getValues("endPlanDt"))} ${getValues(
                        "endPlanHour"
                      )}:${getValues("startPlanMinute")}`}
                  </span>
                </button>
                <div className="text-red-500 mx-auto font-bold text-center">
                  {(!isEmpty(errors.endPlanDt) ||
                    !isEmpty(errors.endPlanHour) ||
                    !isEmpty(errors.endPlanMinute)) &&
                    "하차일시를 입력해주세요"}
                </div>
              </div>
            </div>
            <div className="border-b border-gray-900/10 relative p-3 mb-5 rounded-md shadow-lg pt-8 border border-gray-300">
              <div className="absolute top-0 left-0 w-full bg-mainColor2 rounded-t-md">
                <h2 className="text-base font-semibold leading-5 text-white py-2 shadow-md text-center">
                  화물 정보
                </h2>
              </div>
              <div className="mt-5">
                <input
                  {...register("cargoDsc", {
                    required: "화물상세내용을 입력해주세요.",
                  })}
                  type="text"
                  placeholder="화물상세내용(메모)"
                  className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                />
                <div className="text-red-500 mx-auto font-bold text-center">
                  {errors.cargoDsc?.message}
                </div>
              </div>
              <div className="mt-3">
                <fieldset>
                  <div className="grid grid-flow-col justify-stretch gap-x-2">
                    {isAdmin && (
                      <div
                        className={
                          "flex gap-x-3 ring-1 rounded-md px-4 py-2 w-full " +
                          (watch("multiCargoGub")
                            ? "ring-2 ring-blue-600"
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
                          <label htmlFor="comments" className="font-medium">
                            혼적
                          </label>
                        </div>
                      </div>
                    )}
                    {isAdmin && (
                      <div
                        className={
                          "flex gap-x-3 ring-1 rounded-md px-4 py-2 w-full " +
                          (watch("urgent")
                            ? "ring-2 ring-blue-600"
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
                          <label htmlFor="candidates" className="font-medium">
                            긴급
                          </label>
                        </div>
                      </div>
                    )}
                    {!isAdmin && (
                      <div
                        className={
                          "flex gap-x-3 ring-1 rounded-md px-4 py-2 w-full " +
                          (watch("farePaytype")
                            ? "ring-2 ring-blue-600"
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
                          ? "ring-2 ring-blue-600"
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
                            const cargoTon = Number(getValues("cargoTon"));
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
                        className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
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
                        className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
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
                        maxLength={11}
                        placeholder={"원화주 전화번호('-'없이 입력하세요)"}
                        className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
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
                        className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
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
                        className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <input
                        {...register("fareView")}
                        type="number"
                        maxLength={10}
                        placeholder={"운송료"}
                        className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
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
              <div className="lg:col-span-3 md:col-span-2 mb-5">
                <div className="flex flex-col lg:flex-row justify-between gap-x-5 gap-y-5">
                  <div className="w-full flex flex-col gap-y-3">
                    <div className="grid grid-cols-1 gap-y-3">
                      <p className="px-3 py-1 rounded-full bg-zinc-400 text-white w-fit">
                        출발지
                      </p>
                      <div className="flex gap-x-2">
                        <Label title={"주소"} required={true} />
                        <div className="w-full flex  gap-x-2">
                          <div
                            onClick={(e) => {
                              //searchAddress("start"); //팝업방식
                              handleAddressSearchButton(e, "start"); //레이어 모달 방식
                            }}
                            className="w-full text-right items-center gap-x-5 relative"
                          >
                            <input
                              type="text"
                              placeholder="상차지 주소(시군구동)"
                              disabled={true}
                              value={getValues([
                                "startWide",
                                "startSgg",
                                "startDong",
                              ]).join(" ")}
                              className="block w-full flex-grow-0 rounded-sm border-0 px-2 py-2 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            />
                            <div className="flex items-center text-sm min-w-fit gap-x-1 cursor-pointer font-semibold text-gray-300 hover:font-extralight absolute right-2 top-1.5">
                              <span>주소검색</span>
                              <svg
                                xmlns="h  ttp://www.w3.org/2000/svg"
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
                        <div className="flex gap-x-2">
                          <Label title={"상세주소"} required={true} />
                          <input
                            {...register(`startDetail`, {
                              required: "상세주소를 입력해주세요.",
                            })}
                            type="text"
                            placeholder="상차지 상세주소"
                            className="w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
                            className="block w-full rounded-sm border-0 p-2 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
                              className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
                              maxLength={11}
                              placeholder={"상차지 전화번호"}
                              className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
                      <p className="px-3 py-1 rounded-full bg-zinc-400 text-sm text-white w-fit">
                        도착지
                      </p>
                      <div className="flex gap-x-2">
                        <Label title={"주소"} required={true} />
                        <div className="w-full flex gap-x-2">
                          <div
                            onClick={(e) => {
                              //searchAddress("end"); //팝업방식
                              handleAddressSearchButton(e, "end"); //레이어 모달 방식
                            }}
                            className="w-full text-right items-center gap-x-5 relative"
                          >
                            <input
                              type="text"
                              placeholder="하차지 주소(시군구동)"
                              disabled={true}
                              value={getValues([
                                "endWide",
                                "endSgg",
                                "endDong",
                              ]).join(" ")}
                              className="block w-full flex-grow-0 rounded-sm border-0 px-2 py-2 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                            />
                            <div className="flex items-center text-sm min-w-fit gap-x-1 cursor-pointer font-semibold text-gray-300 hover:font-extralight absolute right-2 top-1.5">
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
                            className="w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
                            className="block w-full rounded-sm border-0 p-2 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
                              className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
                              maxLength={11}
                              placeholder={"하차지 전화번호"}
                              className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
                    <p className="px-3 py-1 rounded-full bg-zinc-400 text-white w-fit">
                      차량선택
                    </p>

                    <div className="grid grid-cols-4 gap-x-3">
                      <div className="rounded-sm border border-gray-200 px-2 pt-2 pb-7 flex flex-col items-center">
                        <img src={"/cars/트럭.png"} className="h-16 w-20" />
                        <div className="w-5/6 mx-auto text-center relative">
                          <p className="w-full py-1 px-3 bg-mainBlue rounded-full text-white absolute -bottom-10">
                            트럭
                          </p>
                        </div>
                      </div>
                      <div className="rounded-sm border border-gray-200 px-2 pt-2 pb-7 flex flex-col items-center">
                        <img
                          src={"/cars/라보.png"}
                          className="h-16 w-20 opacity-40"
                        />
                        <div className="w-5/6 mx-auto text-center relative">
                          <p className="w-full py-1 px-3 bg-gray-200 rounded-full text-gray-400 absolute -bottom-10">
                            라보
                          </p>
                        </div>
                      </div>
                      <div className="rounded-sm border border-gray-200 px-2 pt-2 pb-7 flex flex-col items-center">
                        <img
                          src={"/cars/다마스.png"}
                          className="h-16 w-20 opacity-40"
                        />
                        <div className="w-5/6 mx-auto text-center relative">
                          <p className="w-full py-1 px-3 bg-gray-200 rounded-full text-gray-400 absolute -bottom-10">
                            다마스
                          </p>
                        </div>
                      </div>
                      <div className="rounded-sm border border-gray-200 px-2 pt-2 pb-7 flex flex-col items-center">
                        <img
                          src={"/cars/오토바이 퀵.png"}
                          className="h-16 w-20 opacity-40"
                        />
                        <div className="w-5/6 mx-auto text-center relative">
                          <p className="w-full py-1 px-3 bg-gray-200 rounded-full text-gray-400 absolute -bottom-10">
                            오토바이
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <fieldset>
                        <div className="grid grid-flow-col justify-stretch gap-x-2">
                          {isAdmin && (
                            <div
                              className={
                                "flex gap-x-3 ring-1 rounded-sm px-4 py-2 w-full " +
                                (watch("multiCargoGub")
                                  ? "ring-2 ring-blue-600"
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
                                <label
                                  htmlFor="comments"
                                  className="font-medium"
                                >
                                  혼적
                                </label>
                              </div>
                            </div>
                          )}
                          {isAdmin && (
                            <div
                              className={
                                "flex gap-x-3 ring-1 rounded-sm px-4 py-2 w-full " +
                                (watch("urgent")
                                  ? "ring-2 ring-blue-600"
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
                                <label
                                  htmlFor="candidates"
                                  className="font-medium"
                                >
                                  긴급
                                </label>
                              </div>
                            </div>
                          )}
                          {!isAdmin && (
                            <div
                              className={
                                "flex gap-x-3 ring-1 rounded-sm px-4 py-2 w-full " +
                                (watch("farePaytype")
                                  ? "ring-2 ring-blue-600"
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
                                <label
                                  htmlFor="candidates"
                                  className="font-medium"
                                >
                                  착불
                                </label>
                              </div>
                            </div>
                          )}
                          <div
                            className={
                              "flex gap-x-3 ring-1 rounded-sm px-4 py-2 w-full " +
                              (watch("shuttleCargoInfo")
                                ? "ring-2 ring-blue-600"
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
                    <div className="">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                        <div>
                          <select
                            {...register("cargoTon", {
                              required: `차량톤수(t)를 입력해주세요`,
                              onChange: () => getTruckTypeList(),
                            })}
                            className="block w-full rounded-sm border-0 p-2 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                          >
                            <option value="">차량톤수(t)</option>
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
                            className="block w-full rounded-sm border-0 p-2 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
                                    const cargoTon = Number(
                                      getValues("cargoTon")
                                    );
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
                                className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                              />
                            </div>
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
                          예상 운송료
                          {watchShuttleCargoInfo ? " (왕복)" : " (편도)"} :{" "}
                          {addCommas(watch("fareView")) + "원"}
                        </h2>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-y-3">
                    <p className="px-3 py-1 rounded-full bg-zinc-400 text-white w-fit">
                      상하차일시 / 메모
                    </p>
                    <div className="flex flex-col">
                      <button
                        className="rounded-full py-1.5 w-full bg-white border border-gray-300 flex items-center justify-center gap-x-3 hover:bg-gray-50"
                        onClick={(e) => handleSelectTimeButton(e, "start")}
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
                        <span>상차 일시</span>
                        <span>
                          {getValues([
                            "startPlanDt",
                            "startPlanHour",
                            "startPlanMinute",
                          ]).join("").length == 12 &&
                            ` ${formatDate(
                              getValues("startPlanDt")
                            )} ${getValues("startPlanHour")}:${getValues(
                              "startPlanMinute"
                            )}`}
                        </span>
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
                        className="rounded-full py-1.5 w-full bg-white border border-gray-300 flex items-center justify-center gap-x-3 hover:bg-gray-50"
                        onClick={(e) => handleSelectTimeButton(e, "end")}
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
                        <span>하차 일시</span>
                        <span>
                          {getValues([
                            "endPlanDt",
                            "endPlanHour",
                            "endPlanMinute",
                          ]).join("").length == 12 &&
                            ` ${formatDate(getValues("endPlanDt"))} ${getValues(
                              "endPlanHour"
                            )}:${getValues("startPlanMinute")}`}
                        </span>
                      </button>
                      <div className="text-red-500 mx-auto font-bold text-center">
                        {(!isEmpty(errors.endPlanDt) ||
                          !isEmpty(errors.endPlanHour) ||
                          !isEmpty(errors.endPlanMinute)) &&
                          "하차일시를 입력해주세요"}
                      </div>
                    </div>
                    <div className="">
                      <textarea
                        {...register("cargoDsc", {
                          required: "화물상세내용을 입력해주세요.",
                        })}
                        placeholder="화물상세내용(메모)"
                        rows="5"
                        className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none resize-none"
                      />
                      <div className="text-red-500 mx-auto font-bold text-center">
                        {errors.cargoDsc?.message}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="ml-5 pl-5 pb-5 mb-5 border-l border-dashed border-gray-200">
                  <div className="">
                    <div className="w-full border-b border-gray-200 mb-5">
                      <h2 className="text-base font-semibold py-1">
                        운송료 정보
                        {watchShuttleCargoInfo ? " (왕복)" : " (편도)"}
                      </h2>
                    </div>

                    <div className="mt-3">
                      <div className="grid gap-y-2">
                        <div className="flex gap-x-2">
                          <Label title={"운송료"} />
                          <input
                            {...register("fareView")}
                            type="number"
                            maxLength={10}
                            className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                          />
                        </div>
                        <div className="flex gap-x-2">
                          <Label title={"관리자용"} />
                          <input
                            {...register("fare")}
                            type="number"
                            maxLength={10}
                            className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-5 border-t border-dashed border-gray-200">
                    <div className="w-full border-b border-gray-200 mb-5">
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
                              <option value={""}>의뢰자 구분</option>
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
                            render={({ field: { onChange } }) => (
                              <DateInput
                                onDateChange={onChange}
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
                              {...register("firstShipperNm", {
                                required: "원화주 명을 입력해주세요.",
                              })}
                              type="text"
                              placeholder="원화주 명"
                              className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
                              {...register("firstShipperInfo", {
                                required: "원화주 전화번호를 입력해주세요.",
                              })}
                              type="tel"
                              maxLength={11}
                              placeholder={"원화주 전화번호('-'없이)"}
                              className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
                              {...register("firstShipperBizNo", {
                                required:
                                  getValues("firstType") === "02"
                                    ? "원화주 사업자번호을 입력해주세요."
                                    : false,
                              })}
                              type="text"
                              maxLength={10}
                              placeholder="원화주 사업자번호"
                              className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
                            ? "ring-2 ring-blue-600"
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
                          <label htmlFor="candidates" className="font-medium">
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
                "hidden flex-col p-5 bg-white border border-gray-200 rounded-sm ml-5 row-span-2" +
                (isAdmin ? " 2xl:flex" : " lg:flex")
              }
            >
              <div className="w-full border-b border-gray-300">
                <h2 className="text-base font-semibold py-1">배차 목록</h2>
              </div>
              <ul>
                {recentCargoList &&
                  recentCargoList.map(({ startPlanDt, cargoDsc }, i) => (
                    <li
                      className="py-5 border-b border-gray-200 flex gap-x-5 cursor-pointer"
                      onClick={() => selectCargoOrder(i)}
                    >
                      <span>{formatDate(startPlanDt)}</span>
                      <span>{cargoDsc}</span>
                    </li>
                  ))}
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
