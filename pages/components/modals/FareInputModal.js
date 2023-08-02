import { useContext, useEffect, useState } from "react";
import Label from "../custom/Label";
import AuthContext from "../../context/authContext";
import apiPaths from "../../../services/apiRoutes";
import StartEndAddress from "../mixins/startEndAddress";
import { useInput } from "../../hooks/useInput";
import { isEmptyObject } from "../../../utils/ObjectUtils";
import { isEmpty } from "../../../utils/StringUtils";

const FareInputModal = ({ selectedFare = {}, onCancel, onComplete }) => {
  const { requestServer } = useContext(AuthContext);

  //input elements를 위한 useInput(react-hook)(수정 요청인 경우 금액 세팅)
  const fareMap = {
    oneTon: useInput(selectedFare?.oneTon || "0"),
    twoHalfTon: useInput(selectedFare?.twoHalfTon || "0"),
    threeHalfTon: useInput(selectedFare?.threeHalfTon || "0"),
    fiveTon: useInput(selectedFare?.fiveTon || "0"),
    fiveTonPlus: useInput(selectedFare?.fiveTonPlus || "0"),
    elevenTon: useInput(selectedFare?.elevenTon || "0"),
    eighteenTon: useInput(selectedFare?.eighteenTon || "0"),
    twentyfiveTon: useInput(selectedFare?.twentyfiveTon || "0"),
  };

  //상하차지(수정 요청인 경우 상하차지 세팅)
  const [startAddr, setStartAddr] = useState({
    wide: selectedFare?.startWide || "",
    sgg: selectedFare?.startSgg || "",
  });
  const [endAddr, setEndAddr] = useState({
    wide: selectedFare.endWide || "",
    sgg: selectedFare.endSgg || "",
  });

  //fareMap key 편의를 위한 객체 생성
  const fareNameMap = [
    { varName: "oneTon", korName: "1톤" },
    { varName: "twoHalfTon", korName: "2.5톤" },
    { varName: "threeHalfTon", korName: "3톤" },
    { varName: "fiveTon", korName: "5톤" },
    { varName: "fiveTonPlus", korName: "5톤축" },
    { varName: "elevenTon", korName: "11톤" },
    { varName: "eighteenTon", korName: "18톤" },
    { varName: "twentyfiveTon", korName: "25톤" },
  ];

  //등록/수정 요청 구분
  const requestType = isEmptyObject(selectedFare) ? "I" : "U";

  //Input Validation
  const validationCheck = () => {
    let isValidate = true;
    let message = "";

    // 요금 입력 누락 체크
    Object.keys(fareMap).forEach((key) => {
      const target = fareNameMap.find((fare) => fare.varName == key)?.korName;

      // 요금이 비어있는지 체크
      if (isEmpty(fareMap[key].value)) {
        isValidate = false;
        message = `${target} 금액을 입력하세요.`;
        return;
        // 요금이 숫자인지 체크
      } else {
        if (isNaN(parseInt(fareMap[key].value))) {
          isValidate = false;
          message = `${target} 금액을 숫자로 입력하세요.`;
        }
      }
    });

    //상하차지 입력 누락 체크
    if (
      isEmpty(startAddr.wide) ||
      isEmpty(startAddr.sgg) ||
      isEmpty(endAddr.wide) ||
      isEmpty(endAddr.sgg)
    ) {
      isValidate = false;
      message = "상하차지 주소를 설정해주세요.";
    }

    if (!isValidate) {
      alert(message);
    }

    return isValidate;
  };

  //요금 등록
  const insertFare = async () => {};

  //요금 수정
  const updateFare = async () => {};

  //등록/수정
  const handleSelect = async () => {
    if (validationCheck()) {
      // selectedFare가 비어있다면 등록 아닌 경우 수정
      if (requestType == "U") {
        await updateFare();
      } else {
        await insertFare();
      }

      onComplete();
    }
  };

  return (
    <div className="flex flex-col gap-y-3">
      <p className="text-center font-bold">
        요금 {requestType == "I" ? "입력" : "수정"}
      </p>
      <div className="flex flex-col gap-y-3 mt-3">
        <div className="flex items-center gap-x-3">
          <Label title={"상차지"} required={true} />
          <StartEndAddress
            paramValue={startAddr}
            setValue={setStartAddr}
            isReadOnly={requestType == "U"}
          />
        </div>
        <div className="flex items-center gap-x-3">
          <Label title={"하차지"} required={true} />
          <StartEndAddress
            paramValue={endAddr}
            setValue={setEndAddr}
            isReadOnly={requestType == "U"}
          />
        </div>
        <div className="flex flex-col gap-y-3">
          {fareNameMap.map((fare) => (
            <div className="flex items-center gap-x-3" key={fare.varName}>
              <Label title={fare.korName} required={true} />
              <input
                {...fareMap[fare.varName]}
                type="text"
                className="w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="text-center pt-3">
        <button
          type="button"
          className="rounded-md bg-mainBlue px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
          onClick={handleSelect}
        >
          {requestType == "I" ? "등록" : "수정"}
        </button>
        <button
          type="button"
          className="ml-3 rounded-md bg-normalGray px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          onClick={onCancel}
        >
          취소
        </button>
      </div>
    </div>
  );
};

export default FareInputModal;
