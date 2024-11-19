import { useContext } from "react";
import { useInput } from "../../../hooks/useInput";
import apiPaths from "../../../services/apiRoutes";
import { isEmpty, isNumber } from "../../../utils/StringUtils";
import AuthContext from "../../context/authContext";
import Label from "../custom/Label";

const ModifyAddFareModal = ({ onCancel, onComplete, paramObj: cargoOrder }) => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const isAdmin = userInfo.auth_code === "ADMIN";
  // 차주정보 useInput
  const inputMap = {
    addFare: useInput(cargoOrder?.addFare || "0", "number"),
    addFareReason: useInput(cargoOrder?.addFareReason || ""),
  };

  // 운임료정보 map
  const fareIterator = [
    { varName: "addFare", korName: "추가요금", required: true },
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
    if (isEmpty(inputMap["addFare"].value)) {
      result = false;
      resultMsg = `${korName}을 입력해주세요`;
    }

    if (result) {
      // 추가요금 숫자 체크
      if (!isNumber(inputMap.addFare.value)) {
        result = false;
        resultMsg = "추가요금을 숫자로 입력하세요.";
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
      if (confirm("추가요금을 수정하시겠습니까?")) {
        //배차등록
        await modifyAddFare();
      }
    }
  };

  /**
   * 수기 배차 수행
   */
  const modifyAddFare = async () => {
    const paramObj = {
      cargo_seq: cargoOrder.cargo_seq,
      addFare: inputMap.addFare.value,
      addFareReason: inputMap.addFareReason.value,

      /* startWide: cargoOrder.startWide,
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
      endCompanyName: cargoOrder.endCompanyName, */
    };

    const result = await requestServer(apiPaths.adminModCargoOrder, paramObj);

    if (result.resultCd == "00") {
      alert("추가요금 수정되었습니다.");
      onComplete();
    } else {
      alert("추가요금 수정 실패");
      return;
    }
  };

  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="pb-3 mb-3 border-b border-gray-200">
          <p className="text-xl font-bold">추가요금 수정</p>
        </div>
        <div className="flex flex-col gap-y-3">
          <p className="text-base">추가 운임 정보</p>
          {fareIterator.map(({ varName, korName, required }) => (
            <div key={varName} className="flex items-center gap-x-2">
              <Label title={korName} required={required} />
              <input
                {...inputMap[varName]}
                type="text"
                placeholder={`${korName} 입력`}
                className={`w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none ${
                  !isAdmin ? "pointer-events-none" : ""
                }`}
                disabled={!isAdmin}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="text-center pt-5 grid grid-cols-2 w-full gap-x-3">
        {isAdmin && (
          <button
            type="button"
            className="rounded-md bg-normalGray px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            className="rounded-md bg-mainBlue px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
            onClick={handleAlloc}
          >
            추가요금 수정
          </button>
        )}
      </div>
    </div>
  );
};

export default ModifyAddFareModal;
