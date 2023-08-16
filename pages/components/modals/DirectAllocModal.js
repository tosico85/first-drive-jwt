import { useContext } from "react";
import { useInput } from "../../../hooks/useInput";
import apiPaths from "../../../services/apiRoutes";
import { isEmpty, isNumber } from "../../../utils/StringUtils";
import AuthContext from "../../context/authContext";
import Label from "../custom/Label";

const DirectAllocModal = ({ onCancel, onComplete, paramObj: cargoOrder }) => {
  const { requestServer } = useContext(AuthContext);

  // 차주정보 useInput
  const inputMap = {
    cjName: useInput(""),
    cjPhone: useInput(""),
    cjCarNum: useInput(""),
    cjCargoTon: useInput(""),
    cjTruckType: useInput(""),
    fare: useInput(cargoOrder?.fare || "0"),
    fareView: useInput(cargoOrder?.fareView || "0"),
  };

  // 차주정보 map
  const cjIterator = [
    { varName: "cjName", korName: "이름" },
    { varName: "cjPhone", korName: "전화번호" },
    { varName: "cjCarNum", korName: "차량번호" },
    { varName: "cjCargoTon", korName: "차량톤수" },
    { varName: "cjTruckType", korName: "차량규격" },
  ];

  // 운임료정보 map
  const fareIterator = [
    { varName: "fare", korName: "화주용" },
    { varName: "fareView", korName: "관리자용" },
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
    iterator.forEach(({ varName: key, korName }) => {
      if (!result) return;
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
   * 수기 배차 수행
   */
  const directAllocProc = async () => {
    const paramObj = {
      cargo_seq: cargoOrder.cargo_seq,
      cjName: inputMap.cjName.value,
      cjPhone: inputMap.cjPhone.value,
      cjCarNum: inputMap.cjCarNum.value,
      cjCargoTon: inputMap.cjCargoTon.value,
      cjTruckType: inputMap.cjTruckType.value,
      fare: inputMap.fare.value,
      fareView: inputMap.fareView.value,

      startWide: cargoOrder.startWide,
      startSgg: cargoOrder.startSgg,
      startDong: cargoOrder.startDong,
      startDetail: cargoOrder.startDetail,
      startAreaPhone: cargoOrder.startAreaPhone,
      startPlanDt: cargoOrder.startPlanDt,
      //      startCompanyName: startCompanyName,

      endWide: cargoOrder.endWide,
      endSgg: cargoOrder.endSgg,
      endDong: cargoOrder.endDong,
      endDetail: cargoOrder.endDetail,
      endAreaPhone: cargoOrder.endAreaPhone,
      endPlanDt: cargoOrder.endPlanDt,
      //      endCompanyName: endCompanyName,
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
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="pb-3 mb-3 border-b border-gray-200">
          <p className="text-xl font-bold">
            수기배차 입력 (차량 및 운임료 정보)
          </p>
        </div>
        <div className="flex flex-col gap-y-3">
          <p className="text-base">배차정보(차량정보)</p>
          {cjIterator.map(({ varName, korName }) => (
            <div className="flex items-center gap-x-2">
              <Label title={korName} required={true} />
              <input
                {...inputMap[varName]}
                type="text"
                maxLength={varName == "cjPhone" ? "11" : ""}
                placeholder={`${korName} 입력`}
                className="w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
              />
            </div>
          ))}
        </div>
        <div className="border-b border-gray-200 my-5"></div>
        <div className="flex flex-col gap-y-3">
          <p className="text-base">운임료 정보(화주용/관리자용)</p>
          {fareIterator.map(({ varName, korName }) => (
            <div className="flex items-center gap-x-2">
              <Label title={korName} required={true} />
              <input
                {...inputMap[varName]}
                type="text"
                placeholder={`${korName} 입력`}
                className="w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="text-center pt-5 grid grid-cols-2 w-full gap-x-3">
        <button
          type="button"
          className="rounded-md bg-normalGray px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-md bg-mainBlue px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
          onClick={handleAlloc}
        >
          배차등록
        </button>
      </div>
    </div>
  );
};

export default DirectAllocModal;
