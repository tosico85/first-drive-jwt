import { useContext } from "react";
import { useInput } from "../../../hooks/useInput";
import apiPaths from "../../../services/apiRoutes";
import { isEmpty } from "../../../utils/StringUtils";
import AuthContext from "../../context/authContext";
import Label from "../custom/Label";

const DirectAllocModal = ({ onCancel, onComplete, cargo_seq }) => {
  const { requestServer } = useContext(AuthContext);

  const cjMap = {
    cjName: useInput(""),
    cjPhone: useInput(""),
    cjCarNum: useInput(""),
    cjCargoTon: useInput(""),
    cjTruckType: useInput(""),
  };

  const cjIterator = [
    { varName: "cjName", korName: "이름" },
    { varName: "cjPhone", korName: "전화번호" },
    { varName: "cjCarNum", korName: "차량번호" },
    { varName: "cjCargoTon", korName: "차량톤수" },
    { varName: "cjTruckType", korName: "차량규격" },
  ];

  /**
   * 입력 값 체크
   * @returns isValidate
   */
  const validationCheck = () => {
    let result = true;
    let resultMsg = "";

    cjIterator.forEach(({ varName: key, korName }) => {
      if (!result) return;
      if (isEmpty(cjMap[key].value)) {
        result = false;
        resultMsg = `${korName}을 입력해주세요`;
      }
    });

    if (!result) {
      alert(resultMsg);
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
      cargo_seq,
      cjName: cjMap.cjName.value,
      cjPhone: cjMap.cjPhone.value,
      cjCarNum: cjMap.cjCarNum.value,
      cjCargoTon: cjMap.cjCargoTon.value,
      cjTruckType: cjMap.cjTruckType.value,
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
        <div className="pb-5 mb-5 border-b border-gray-200">
          <p className="text-xl font-bold">수기배차(차량정보)</p>
        </div>
        <div className="flex flex-col gap-y-3">
          {cjIterator.map(({ varName, korName }) => (
            <div className="flex items-center gap-x-2">
              <Label title={korName} required={true} />
              <input
                {...cjMap[varName]}
                type="text"
                placeholder={`${korName} 입력`}
                className="w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="text-center pt-10 grid grid-cols-2 w-full gap-x-3">
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
