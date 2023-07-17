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
import { addCommas, isEmpty } from "../../../utils/StringUtils";
import SearchAddressModal from "../modals/SearchAddressModal";

export default function OrderForm({
  isEdit = false,
  isCopy = false,
  editData = {},
  isDirectApi = false,
  userInfo,
}) {
  const router = useRouter();
  const { requestServer } = useContext(AuthContext);
  //const [paramData, setParamData] = useState(editData || {});
  const [cargoTonList, setCargoTonList] = useState([]);
  const [truckTypeList, setTruckTypeList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [modalStartEnd, setModalStartEnd] = useState("");
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
  const [fareMap, setFareMap] = useState({});

  const LOAD_TYPE_LIST = [
    "지게차",
    "수작업",
    "크레인",
    "호이스트",
    "컨베이어",
    "기타",
  ];
  const PAY_TYPE_LIST = ["선착불", "인수증", "카드"];

  const methods = useForm({ mode: "onSubmit" });

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    clearErrors,
    watch,
    control,
    formState: { errors },
  } = methods;

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
      })();
    }
  }, [userInfo]);

  //운송료 착불인 경우 세금계산서 disable 처리(값 변경 시 이벤트)
  useEffect(() => {
    //console.log("changed.!! ", watchFarePayType);

    if (watchFarePayType === "선착불") {
      setValue("taxbillType", false);
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

    if (Object.keys(start).length > 0) {
      setStartAddressData({
        startWide: start.wide,
        startSgg: start.sgg,
        startDong: start.dong,
        startDetail: start.detail,
      });
      startBaseYn = start.baseYn;
    }

    if (Object.keys(end).length > 0) {
      setEndAddressData({
        endWide: end.wide,
        endSgg: end.sgg,
        endDong: end.dong,
        endDetail: end.detail,
      });
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
    if (isEdit) {
      updateCargoOrder();
    } else {
      createCargoOrder();
    }
  };

  /**
   * submit invalid event
   * 누락된 값 있는 경우 이 이벤트..
   */
  const oninvalid = () => {
    //console.log(getValues("startPlanDt"));
    //console.log(editData);
    console.log(errors);
  };

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

  // Open Modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Open Modal
  const openAddressModal = () => {
    setIsAddressModalOpen(true);
  };

  // Close Modal
  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
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
      width: "90%",
      height: "70%",
      borderRadius: "10px",
      transform: "translate(-50%, -50%)",
    },
  };

  /**
   * @title 주소 검색(팝업창 방식)
   * @param {상하차 구분} startEnd
   */
  function searchAddress(startEnd) {
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
  }

  return (
    <div className="p-5">
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Modal"
        style={customModalStyles}
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
        style={customModalStyles}
      >
        <SearchAddressModal
          onCancel={closeAddressModal}
          onComplete={callbackAddressModal}
        />
      </Modal>
      <form onSubmit={handleSubmit(onValid, oninvalid)}>
        <div className="pb-12 grid sm:grid-cols-2 gap-x-5">
          <div className="border-b border-gray-900/10 relative p-3 mb-5 rounded-md shadow-lg pt-8 border border-gray-300 sm:row-span-2">
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
                        const { startWide, startSgg, startDong } = returnValue;
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
                <div className="text-red-500 mx-auto mb-3 font-bold text-center">
                  {errors.startAddress?.message}
                </div>
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
                  {errors[`startDetail`]?.message}
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
                <div className="text-red-500 mx-auto font-bold text-center">
                  {errors.endAddress?.message}
                </div>
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
                  {errors[`endDetail`]?.message}
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
            <div className="sm:flex sm:items-center">
              <label className="font-medium mr-2 sm:pt-2">상차일시</label>
              <div className="flex items-center mt-1 gap-x-2">
                <Controller
                  control={control}
                  name="startPlanDt"
                  rules={{ required: "상차일자를 입력해주세요." }}
                  render={({ field: { onChange } }) => (
                    <DateInput
                      onDateChange={onChange}
                      dateValue={getValues("startPlanDt")}
                      addClass="w-36"
                    />
                  )}
                />
                <select
                  {...register("startPlanHour", {
                    required: `상차시간을 입력해주세요`,
                  })}
                  className="rounded-md text-center border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                >
                  <option value="">- 시 -</option>
                  {Array.from(Array(24).keys(), (num) =>
                    num.toString().padStart(2, "0")
                  ).map((nm, i) => (
                    <option key={i} value={nm}>
                      {nm}
                    </option>
                  ))}
                </select>
                <select
                  {...register("startPlanMinute", {
                    required: `상차(분)을 입력해주세요`,
                  })}
                  className="rounded-md text-center border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                >
                  <option value="">- 분 -</option>
                  <option value="00">00</option>
                  <option value="30">30</option>
                </select>
              </div>
            </div>
            <div className="text-red-500 mx-auto font-bold text-center">
              {(!isEmpty(errors.startPlanDt) ||
                !isEmpty(errors.startPlanHour) ||
                !isEmpty(errors.startPlanMinute)) &&
                "상차일시를 입력해주세요"}
            </div>
            <div className="mt-3 sm:flex sm:items-center sm:mt-1">
              <label className="font-medium mr-2 sm:pt-2">하차일시</label>
              <div className="flex items-center mt-1 gap-x-2">
                <Controller
                  control={control}
                  name="endPlanDt"
                  rules={{ required: "하차일자를 입력해주세요." }}
                  render={({ field: { onChange } }) => (
                    <DateInput
                      onDateChange={onChange}
                      dateValue={getValues("endPlanDt")}
                      addClass="w-36"
                    />
                  )}
                />
                <select
                  {...register("endPlanHour", {
                    required: `하차시간을 입력해주세요`,
                  })}
                  className="rounded-md text-center border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                >
                  <option value="">- 시 -</option>
                  {Array.from(Array(24).keys(), (num) =>
                    num.toString().padStart(2, "0")
                  ).map((nm, i) => (
                    <option key={i} value={nm}>
                      {nm}
                    </option>
                  ))}
                </select>
                <select
                  {...register("endPlanMinute", {
                    required: `하차(분)을 입력해주세요`,
                  })}
                  className="rounded-md text-center border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                >
                  <option value="">- 분 -</option>
                  <option value="00">00</option>
                  <option value="30">30</option>
                </select>
              </div>
            </div>
            <div className="text-red-500 mx-auto font-bold text-center">
              {(!isEmpty(errors.endPlanDt) ||
                !isEmpty(errors.endPlanHour) ||
                !isEmpty(errors.endPlanMinute)) &&
                "하차일시를 입력해주세요"}
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

        <div className="fixed bottom-0 left-0 p-3 w-full bg-white border shadow-md">
          <div className="flex items-center justify-end lg:gap-x-6 gap-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md bg-normalGray px-2 py-2 text-sm sm:text-base font-semibold text-white shadow-sm"
            >
              Cancel
            </button>
            {isDirectApi ? (
              <button
                type="submit"
                className="rounded-md bg-buttonZamboa px-2 py-2 text-sm sm:text-base font-semibold text-white shadow-sm"
              >
                배차신청 수정
              </button>
            ) : (
              <button
                type="submit"
                className="rounded-md bg-mainColor3 px-2 py-2 text-sm sm:text-base font-semibold text-white shadow-sm"
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
