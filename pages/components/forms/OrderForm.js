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

export default function OrderForm({
  isEdit = false,
  isCopy = false,
  editData = {},
  isDirectApi = false,
}) {
  const router = useRouter();
  const {
    requestServer,
    userInfo: { auth_code },
  } = useContext(AuthContext);
  //const [paramData, setParamData] = useState(editData || {});
  const [cargoTonList, setCargoTonList] = useState([]);
  const [truckTypeList, setTruckTypeList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  let addressPopupStartEnd = "";
  let startBaseYn = "N";
  let endBaseYn = "N";
  const isAdmin = auth_code === "ADMIN";

  /**
   * 화면 로딩 시 event
   */
  useEffect(() => {
    (async () => {
      const { code, data } = await requestServer(apiPaths.apiOrderCargoTon, {});
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
  }, [auth_code]);

  useEffect(() => {
    //console.log("changed.!! ", watchFarePayType);

    if (watchFarePayType === "선착불") {
      setValue("taxbillType", false);
    }
  }, [watchFarePayType]);

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
      router.push("/");
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

  // Open Modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
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
      width: "80%",
      height: "80%",
      borderRadius: "10px",
      transform: "translate(-50%, -50%)",
    },
  };

  /**
   * @title 주소 검색
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
    <div>
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
      <form onSubmit={handleSubmit(onValid, oninvalid)}>
        <div className="border-b border-gray-900/10 dark:border-gray-900/40 pb-8">
          <h2 className="text-lg font-semibold leading-7">상차지 정보</h2>
          <p className="mt-1 text-sm leading-6 mb-5 text-gray-600 dark:text-gray-300">
            상차지 주소 및 상차방법, 상차일자를 입력해주세요.
          </p>
          <div className="mt-10 mb-3 grid grid-cols-2 sm:grid-cols-5 justify-between items-center">
            <h2 className="text-base font-semibold leading-7">상차지 주소</h2>
            <div className="text-right sm:text-left flex items-center gap-x-5 justify-end">
              <div
                className="flex items-center text-sm min-w-fit gap-x-1 cursor-pointer font-semibold hover:font-extralight"
                onClick={(e) => {
                  //handleSearchAddressButton(e, "start");
                  searchAddress("start");
                }}
              >
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

              <button
                className="min-w-fit rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bg-amber-600"
                onClick={(e) => {
                  handleAddressButton(e, "start");
                }}
              >
                주소록
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1">
            <div className="mb-5">
              <label className="block text-sm font-medium leading-6">
                지역 선택(시/군/구, 동)
              </label>
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
              <label className="block text-sm font-medium leading-6">
                상세주소
              </label>
              <input
                {...register(`startDetail`, {
                  required: "상세주소를 입력해주세요.",
                })}
                type="text"
                placeholder="상차지 상세주소"
                className="block sm:w-3/5 w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
              />

              <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                {errors[`startDetail`]?.message}
              </div>
            </div>
          </div>
          <div className="mt-5 grid lg:grid-cols-6 grid-cols-1">
            <div>
              <label className="block text-sm font-medium leading-6">
                상차일자
              </label>
              <Controller
                control={control}
                name="startPlanDt"
                rules={{ required: "상차일자를 입력해주세요." }}
                render={({ field: { onChange } }) => (
                  <DateInput
                    onDateChange={onChange}
                    dateValue={getValues("startPlanDt")}
                  />
                )}
              />
              <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                {errors.startPlanDt?.message}
              </div>
            </div>
            <div className="lg:col-span-5">
              <label className="block text-sm font-medium leading-6">
                상차방법
              </label>
              <select
                {...register("startLoad", {
                  required: `상차방법을 입력해주세요`,
                })}
                className="block w-full lg:w-1/4 rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
              >
                <option value="">상차방법</option>
                {LOAD_TYPE_LIST.map((item, i) => (
                  <option key={i} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                {errors.startLoad?.message}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 dark:border-gray-900/40 py-8">
          <h2 className="text-lg font-semibold leading-7">하차지 정보</h2>
          <p className="mt-1 text-sm leading-6 mb-5 text-gray-600 dark:text-gray-300">
            하차지 주소 및 하차방법, 하차일자, 연락처 정보를 입력해주세요.
          </p>
          <div className="mt-10 mb-3 grid grid-cols-2 sm:grid-cols-5 justify-between items-center">
            <h2 className="text-base font-semibold leading-7">하차지 주소</h2>
            <div className="text-right sm:text-left flex items-center gap-x-5 justify-end">
              <div
                className="flex items-center text-sm min-w-fit gap-x-1 cursor-pointer font-semibold hover:font-extralight"
                onClick={(e) => {
                  //handleSearchAddressButton(e, "start");
                  searchAddress("end");
                }}
              >
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
              <button
                className="rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bg-amber-600"
                onClick={(e) => {
                  handleAddressButton(e, "end");
                }}
              >
                주소록
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1">
            <div className="mb-5">
              <label className="block text-sm font-medium leading-6">
                지역 선택(시/군/구, 동)
              </label>
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
              <div className="text-red-500 mx-auto mb-3 font-bold text-center">
                {errors.endAddress?.message}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6">
                상세주소
              </label>
              <input
                {...register(`endDetail`, {
                  required: "상세주소를 입력해주세요.",
                })}
                type="text"
                placeholder="하차지 상세주소"
                className="block sm:w-3/5 w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
              />
              <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                {errors[`endDetail`]?.message}
              </div>
            </div>
          </div>
          <div className="mt-5 grid lg:grid-cols-5 grid-cols-1 lg:gap-x-10 gap-y-5">
            <div>
              <label className="block text-sm font-medium leading-6">
                하차일자
              </label>
              <Controller
                control={control}
                name="endPlanDt"
                rules={{ required: "하차일자를 입력해주세요." }}
                render={({ field: { onChange } }) => (
                  <DateInput
                    onDateChange={onChange}
                    dateValue={getValues("endPlanDt")}
                  />
                )}
              />
              <div className="text-red-500 mx-auto mb-3 font-bold text-center">
                {errors.endPlanDt?.message}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6">
                하차방법
              </label>
              <select
                {...register("endLoad", {
                  required: `하차방법을 입력해주세요`,
                })}
                className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
              >
                <option value="">하차방법</option>
                {LOAD_TYPE_LIST.map((item, i) => (
                  <option key={i} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <div className="text-red-500 mx-auto mb-3 font-bold text-center">
                {errors.endLoad?.message}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6">
                하차지 전화번호
              </label>
              <input
                {...register("endAreaPhone", {
                  required: "하차지 전화번호를 입력해주세요.",
                })}
                type="tel"
                maxLength={11}
                placeholder={"'-'없이 입력하세요"}
                className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
              />
              <div className="text-red-500 mx-auto mb-3 font-bold text-center">
                {errors.endAreaPhone?.message}
              </div>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-900/10 dark:border-gray-900/40 py-8">
          <h2 className="text-lg font-semibold leading-7">화물 정보</h2>
          <p className="mt-1 text-sm leading-6 mb-5 text-gray-600 dark:text-gray-300">
            화물 내용과 차량정보를 입력해주세요.
          </p>
          <div className="mt-10">
            <label className="block text-sm font-medium leading-6">
              화물상세내용(메모)
            </label>
            <input
              {...register("cargoDsc", {
                required: "화물상세내용을 입력해주세요.",
              })}
              type="text"
              className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
            />
            <div className="text-red-500 mx-auto mb-6 font-bold text-center">
              {errors.cargoDsc?.message}
            </div>
          </div>
          <div className="mt-10">
            <fieldset>
              <legend className="text-base font-semibold leading-6">
                화물 선택사항
              </legend>
              <div className="mt-3 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-4">
                {isAdmin && (
                  <div className="relative flex gap-x-3">
                    <div className="flex h-6 items-center">
                      <input
                        {...register("multiCargoGub")}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="text-sm leading-6">
                      <label htmlFor="comments" className="font-medium">
                        혼적여부
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        (선택)혼적여부를 체크해주세요.
                      </p>
                    </div>
                  </div>
                )}
                {isAdmin && (
                  <div className="relative flex gap-x-3">
                    <div className="flex h-6 items-center">
                      <input
                        {...register("urgent")}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="text-sm leading-6">
                      <label htmlFor="candidates" className="font-medium">
                        긴급여부
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        (선택)긴급여부를 체크해주세요.
                      </p>
                    </div>
                  </div>
                )}
                {!isAdmin && (
                  <div className="relative flex gap-x-3">
                    <div className="flex h-6 items-center">
                      <input
                        {...register("farePaytype")}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="text-sm leading-6">
                      <label htmlFor="candidates" className="font-medium">
                        착불여부
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        (선택)착불여부를 체크해주세요.
                      </p>
                    </div>
                  </div>
                )}
                <div className="relative flex gap-x-3">
                  <div className="flex h-6 items-center">
                    <input
                      {...register("shuttleCargoInfo")}
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label htmlFor="offers" className="font-medium">
                      왕복여부
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      (선택)왕복여부를 체크해주세요.
                    </p>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
          <div className="mt-10">
            <h2 className="text-base font-semibold leading-7 mb-3">
              차량 정보
            </h2>
            <div className="grid gap-y-3 lg:grid-cols-4 lg:gap-x-10">
              <div>
                <label className="block text-sm font-medium leading-6">
                  차량톤수
                </label>
                <select
                  {...register("cargoTon", {
                    required: `차량톤수(t)를 입력해주세요`,
                    onChange: () => getTruckTypeList(),
                  })}
                  className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
                >
                  <option value="">차량톤수(t)</option>
                  {cargoTonList.map(({ nm }, i) => (
                    <option key={i} value={nm}>
                      {nm}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium leading-6">
                  차량종류
                </label>
                <select
                  {...register("truckType", {
                    required: `차량종류를 입력해주세요`,
                  })}
                  className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
                >
                  <option value="">차량종류</option>
                  {truckTypeList &&
                    truckTypeList.map(({ nm }, i) => (
                      <option key={i} value={nm}>
                        {nm}
                      </option>
                    ))}
                </select>
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium leading-6">
                    적재중량(t)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="차량톤수의 110%까지"
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
                    })}
                    className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="border-b border-gray-900/10 dark:border-gray-900/40 py-8">
            <h2 className="text-lg font-semibold leading-7">
              화주 및 의뢰 정보
            </h2>
            <p className="mt-1 text-sm leading-6 mb-10 text-gray-600 dark:text-gray-300">
              원화주 정보와 운송료 관련 정보를 입력하세요
            </p>
            <div>
              <h2 className="text-base font-semibold leading-7 mb-3">
                의뢰 정보
              </h2>
              <div className="grid gap-y-3 lg:grid-cols-4 lg:gap-x-10">
                <div>
                  <label className="block text-sm font-medium leading-6">
                    의뢰자 구분
                  </label>
                  <select
                    {...register("firstType")}
                    className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
                  >
                    <option value={"01"}>일반화주</option>
                    <option value={"02"}>주선/운송사</option>
                  </select>
                  <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                    {errors.firstType?.message}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium leading-6">
                    운송료 지불구분
                  </label>
                  <select
                    {...register("farePaytype", {
                      required: `운송료 지불구분을 입력해주세요`,
                    })}
                    className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
                  >
                    <option value="">운송료 지불구분</option>
                    {PAY_TYPE_LIST.map((item, i) => (
                      <option key={i} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                    {errors.farePaytype?.message}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium leading-6">
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
                      />
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="mt-10">
              <h2 className="text-base font-semibold leading-7 mb-3">
                원화주 정보
              </h2>
              <div className="grid gap-y-3 lg:grid-cols-4 lg:gap-x-10">
                <div>
                  <label className="block text-sm font-medium leading-6">
                    원화주 명
                  </label>
                  <input
                    {...register("firstShipperNm", {
                      required: "원화주 명을 입력해주세요.",
                    })}
                    type="text"
                    className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
                  />
                  <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                    {errors.firstShipperNm?.message}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium leading-6">
                    원화주 전화번호
                  </label>
                  <input
                    {...register("firstShipperInfo", {
                      required: "원화주 전화번호를 입력해주세요.",
                    })}
                    type="tel"
                    maxLength={11}
                    placeholder={"'-'없이 입력하세요"}
                    className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
                  />
                  <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                    {errors.firstShipperInfo?.message}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium leading-6">
                    원화주 사업자번호
                  </label>
                  <input
                    {...register("firstShipperBizNo", {
                      required:
                        getValues("firstType") === "02"
                          ? "원화주 사업자번호을 입력해주세요."
                          : false,
                    })}
                    type="text"
                    maxLength={10}
                    placeholder="의뢰자 주선/운송사인 경우 필수"
                    className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
                  />
                  <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                    {errors.firstShipperBizNo?.message}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-10">
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
                    전자세금계산서 발행여부
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">
                    (선택)전자세금계산서 발행여부를 체크해주세요. (선착불은 선택
                    불가)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="border-b border-gray-900/10 dark:border-gray-900/40 py-8">
            <h2 className="text-lg font-semibold leading-7">운송료 정보</h2>
            <p className="mt-1 text-sm leading-6 mb-10 text-gray-600 dark:text-gray-300">
              운송료를 입력해주세요.(최소 20,000)
            </p>

            <div className="mt-10">
              <div className="grid gap-y-3 lg:grid-cols-5 lg:gap-x-10">
                <div>
                  <label className="block text-sm font-medium leading-6">
                    운송료
                  </label>
                  <input
                    {...register("fare")}
                    type="number"
                    maxLength={10}
                    placeholder={"최소 운송료 20,000"}
                    className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium leading-6">
                    운송료(화주노출용)
                  </label>
                  <input
                    {...register("fareView")}
                    type="number"
                    maxLength={10}
                    placeholder={"최소 운송료 20,000"}
                    className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
                  />
                </div>
                {/* <div className="hidden">
                <label className="block text-sm font-medium leading-6">
                  수수료
                </label>
                <input
                  {...register("fee")}
                  type="number"
                  maxLength={10}
                  placeholder={"수수료눈 운송료의 50% 미만입니다."}
                  className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
                />
              </div> */}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm font-semibold leading-6"
          >
            Cancel
          </button>
          {isDirectApi ? (
            <button
              type="submit"
              className="rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              배차신청 수정
            </button>
          ) : (
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {isEdit ? "화물 수정" : "화물 등록"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
