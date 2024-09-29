import { useContext } from "react";
import { useInput } from "../../../hooks/useInput";
import apiPaths from "../../../services/apiRoutes";
import {
  formatPhoneNumber,
  isEmpty,
  isNumber,
} from "../../../utils/StringUtils";
import AuthContext from "../../context/authContext";
import Label from "../custom/Label";

const DirectAllocModal = ({ onCancel, onComplete, paramObj: cargoOrder }) => {
  const { requestServer, userInfo } = useContext(AuthContext);

  // 차주정보 useInput
  const inputMap = {
    cjName: useInput(cargoOrder?.cjName || ""),
    cjPhone: useInput(formatPhoneNumber(cargoOrder?.cjPhone) || "", "phone"),
    cjCarNum: useInput(cargoOrder?.cjCarNum || ""),
    cjCargoTon: useInput(cargoOrder?.cjCargoTon || "", "float"),
    cjTruckType: useInput(cargoOrder?.cjTruckType || ""),
    fare: useInput(cargoOrder?.fare || "0", "number"),
    fareView: useInput(cargoOrder?.fareView || "0", "number"),
    addFare: useInput(cargoOrder?.addFare || "0", "number"),
    addFareReason: useInput(cargoOrder.addFareReason || ""),
    adminMemo: useInput(cargoOrder.adminMemo || ""),
    ordNo: useInput(cargoOrder.ordNo || ""),
  };

  // 차주정보 map
  const cjIterator = [
    { varName: "cjName", korName: "이름", required: true },
    { varName: "cjPhone", korName: "전화번호", required: true },
    { varName: "cjCarNum", korName: "차량번호", required: true },
    { varName: "cjCargoTon", korName: "차량톤수", required: true },
    { varName: "cjTruckType", korName: "차량규격", required: true },
  ];

  // 운임료정보 map
  const fareIterator = [
    { varName: "fareView", korName: "화주용", required: true },
    { varName: "fare", korName: "관리자용", required: true },
    { varName: "adminMemo", korName: "관리자메모", required: false },
    { varName: "ordNo", korName: "오더번호", required: false },
    { varName: "addFare", korName: "추가요금", required: false },
    { varName: "addFareReason", korName: "추가사유", required: false },
  ];

  /**
   * 입력 값 체크
   * @returns isValidate
   */
  const validationCheck = () => {
    let result = true;
    let resultMsg = "";

    // 필수 입력값 체크
    const iterator = [...cjIterator, ...fareIterator];
    iterator.forEach(({ varName: key, korName, required }) => {
      if (!result) return;
      if (!required) return;
      if (isEmpty(inputMap[key].value)) {
        result = false;
        resultMsg = `${korName}을 입력해주세요`;
      }
    });

    if (result) {
      // 운임료 숫자 체크, 최저운임료 체크
      if (
        !isNumber(inputMap.fare.value) ||
        !isNumber(inputMap.fareView.value)
      ) {
        result = false;
        resultMsg = "운임료를 숫자로 입력하세요.";
      }
    }

    if (!result) {
      alert(resultMsg);
      return result;
    }

    return result;
  };

  /**
   * 배차등록 버튼 click
   */
  const handleAlloc = async () => {
    if (validationCheck()) {
      if (confirm("수기로 배차하시겠습니까?")) {
        //배차등록
        await directAllocProc();
      }
    }
  };

  /**
   * 수기 배차 수행 (화주 알람톡 변수 전송)
   */
  const directAllocProc = async () => {
    const paramObj = {
      cargo_seq: cargoOrder.cargo_seq,
      cjName: inputMap.cjName.value,
      cjPhone: inputMap.cjPhone.value.replace(/[^0-9]/g, ""),
      cjCarNum: inputMap.cjCarNum.value,
      cjCargoTon: inputMap.cjCargoTon.value,
      cjTruckType: inputMap.cjTruckType.value,

      fare: inputMap.fare.value,
      fareView: inputMap.fareView.value,
      addFare: inputMap.addFare.value || "0",
      addFareReason: inputMap.addFareReason.value,
      adminMemo: inputMap.adminMemo.value,
      ordNo: inputMap.ordNo.value,

      startWide: cargoOrder.startWide,
      startSgg: cargoOrder.startSgg,
      startDong: cargoOrder.startDong,
      startDetail: cargoOrder.startDetail,
      startAreaPhone: cargoOrder.startAreaPhone,
      startPlanDt: cargoOrder.startPlanDt,
      startCompanyName: cargoOrder.startCompanyName,

      endWide: cargoOrder.endWide,
      endSgg: cargoOrder.endSgg,
      endDong: cargoOrder.endDong,
      endDetail: cargoOrder.endDetail,
      endAreaPhone: cargoOrder.endAreaPhone,
      endPlanDt: cargoOrder.endPlanDt,
      endCompanyName: cargoOrder.endCompanyName,
      create_user: cargoOrder.create_user,
      userEmail: userInfo.email, // userInfo.email 확인 후 적용
    };

    const result = await requestServer(apiPaths.adminDirectAlloc, paramObj);

    if (result.resultCd == "00") {
      alert("배차 등록되었습니다.");
      onComplete();
    } else {
      alert("배차등록 실패");
      return;
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col">
        <div className="mb-4 border-b border-gray-200">
          <p className="text-2xl font-bold">
            수기배차 입력 (차량 및 운임료 정보)
          </p>
        </div>
        {cjIterator.map(({ varName, korName, required }) => (
          <div key={varName} className="mb-4 lg:flex lg:gap-x-2">
            <Label title={korName} required={required} />
            <input
              {...inputMap[varName]}
              type="text"
              maxLength={varName === "cjPhone" ? "14" : ""}
              placeholder={`${korName} 입력`}
              className="w-full rounded-md border-2 px-3 py-2 shadow-md placeholder-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor focus:outline-none"
            />
          </div>
        ))}
        {fareIterator.map(({ varName, korName, required }) => (
          <div key={varName} className="mb-4 lg:flex lg:gap-x-2">
            <Label title={korName} required={required} />
            <input
              {...inputMap[varName]}
              type="text"
              placeholder={`${korName} 입력`}
              className="w-full rounded-md border-2 px-3 py-2 shadow-md placeholder-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor focus:outline-none"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4 space-x-4">
        <button
          type="button"
          className="w-1/2 md:w-1/4 rounded-md bg-normalGray px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-gray-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-gray-400"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="w-1/2 md:w-1/4 rounded-md bg-mainBlue px-4 py-2 text-base font-semibold text-white shadow-md hover:bg-indigo-400 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-mainColor2"
          onClick={handleAlloc}
        >
          배차등록
        </button>
      </div>
    </div>
  );
};

export default DirectAllocModal;
