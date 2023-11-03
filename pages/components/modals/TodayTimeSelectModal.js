import { useState } from "react";
import { useRadio } from "../../../hooks/useInput";
import { useEffect } from "react";
import { isEmptyObject } from "../../../utils/ObjectUtils";
import {
  getDayYYYYMMDD,
  getNextHourHH,
  isEmpty,
} from "../../../utils/StringUtils";

const TodayTimeSelectModal = ({ onCancel, onComplete, paramObj }) => {
  // 상하차 시간 변수
  const [startAmPmValue, setStartAmPmValue] = useState("");
  const [startHourValue, setStartHourValue] = useState("");
  const [startMinuteValue, setStartMinuteValue] = useState("");
  const [endAmPmValue, setEndAmPmValue] = useState("");
  const [endHourValue, setEndHourValue] = useState("");
  const [endMinuteValue, setEndMinuteValue] = useState("");

  //checkbox 제어 변수
  const startNowCheck = useRadio(false);
  const startTodayCheck = useRadio(true);
  const endTodayCheck = useRadio(false);
  const endTommCheck = useRadio(true);

  // 상하차 시간 disabled제어 변수
  const [disableStartTime, setDisableStartTime] = useState(false);
  const [disableEndTime, setDisableEndTime] = useState(false);

  // 모달 팝업 로딩 event
  useEffect(() => {
    if (!isEmptyObject(paramObj)) {
      const {
        startPlanHour,
        startPlanMinute,
        endPlanDt,
        endPlanHour,
        endPlanMinute,
      } = paramObj;
      //console.log("getNextHourHH(1)", getNextHourHH(1));
      const nextHour = getNextHourHH(1) == "00" ? "24" : getNextHourHH(1); //햔제 시간 + 1(밤 12시는 24시로 설정)
      const isNowStart = startPlanHour <= nextHour; //nextHour 이하는 '지금'
      const isTommEnd = endPlanDt == getDayYYYYMMDD(1); //하차일이 내일인 경우 '내일'

      // 지금/당일 선택
      startNowCheck.setChecked(isNowStart);
      startTodayCheck.setChecked(!isNowStart);

      // 당착/내일 선택
      endTodayCheck.setChecked(!isTommEnd);
      endTommCheck.setChecked(isTommEnd);

      // 상차일시 : 당일이고, 시간을 받은 경우
      if (!isNowStart) {
        if (startPlanHour >= nextHour) {
          // 오전 / 오후 설정
          if (Number.parseInt(startPlanHour) > 11) {
            setStartAmPmValue("12");
          } else {
            setStartAmPmValue("0");
          }

          setStartHourValue(startPlanHour);
          setStartMinuteValue(startPlanMinute);
        }
      }

      // 하차일시 : 내일이고, 시간을 받은 경우
      if (isTommEnd) {
        if (Number.parseInt(endPlanHour) > 11) {
          setEndAmPmValue("12");
        } else {
          setEndAmPmValue("0");
        }
        setEndHourValue(endPlanHour);
        setEndMinuteValue(endPlanMinute);
      }
    }
  }, []);

  // 지금, 당착 이벤트 disable제어 처리
  useEffect(() => {
    if (startNowCheck.checked) {
      setStartAmPmValue("");
      setStartMinuteValue("");
      setDisableStartTime(true);
    } else {
      setDisableStartTime(false);
    }

    if (endTodayCheck.checked) {
      setEndAmPmValue("");
      setEndMinuteValue("");
      setDisableEndTime(true);
    } else {
      setDisableEndTime(false);
    }
  }, [startNowCheck.checked, endTodayCheck.checked]);

  /************* SelectBox Change Event ***********/
  // 상차일 : 오전/오후
  const handleStartAmPm = (e) => {
    const {
      target: { value },
    } = e;
    setStartAmPmValue(value);
  };

  // 상차일 : 시간
  const handleStartHour = (e) => {
    const {
      target: { value },
    } = e;
    setStartHourValue(value);

    console.log("value", value);
    if (value != "") {
      if (startMinuteValue == "") {
        setStartMinuteValue("00");
      }
    }
  };

  // 상차일 : 분(00, 30)
  const handleStartMinute = (e) => {
    const {
      target: { value },
    } = e;
    setStartMinuteValue(value);
  };

  // 하차일 : 오전/오후
  const handleEndAmPm = (e) => {
    const {
      target: { value },
    } = e;
    setEndAmPmValue(value);
  };

  // 하차일 : 시간
  const handleEndHour = (e) => {
    const {
      target: { value },
    } = e;
    setEndHourValue(value);

    if (value != "") {
      if (endMinuteValue == "") {
        setEndMinuteValue("00");
      }
    }
  };

  // 하차일 : 분(00, 30)
  const handleEndMinute = (e) => {
    const {
      target: { value },
    } = e;
    setEndMinuteValue(value);
  };

  const validationCheck = () => {
    console.log("startNowCheck", startNowCheck);
    console.log("startTodayCheck", startTodayCheck);
    if (startTodayCheck.checked) {
      if (
        isEmpty(startAmPmValue) ||
        isEmpty(startHourValue) ||
        isEmpty(startMinuteValue)
      ) {
        alert("당일 상차인 경우 시간을 입력하세요.");
        return false;
      }
    }

    if (endTommCheck.checked) {
      if (
        isEmpty(endAmPmValue) ||
        isEmpty(endHourValue) ||
        isEmpty(endMinuteValue)
      ) {
        alert("내일 하차인 경우 시간을 입력하세요.");
        return false;
      }
    }
    return true;
  };

  // 선택 이벤트
  const handleSelect = () => {
    const nowDate =
      getNextHourHH(1) == "00" ? getDayYYYYMMDD(1) : getDayYYYYMMDD();

    if (validationCheck()) {
      const returnObj = {
        startPlanDt: nowDate, //상차일자(오늘, 다음 시간이 00시인 경우 다음 일자)
        startPlanHour: startNowCheck.checked
          ? getNextHourHH(1)
          : startHourValue, //상차시간(지금 체크인 경우 다음 시간)
        startPlanMinute: startMinuteValue || "00",
        endPlanDt: endTodayCheck.checked ? nowDate : getDayYYYYMMDD(1), //당착인 경우 오늘
        endPlanHour: endTodayCheck.checked
          ? startNowCheck.checked
            ? getNextHourHH(1)
            : startHourValue
          : endHourValue, //당착인 경우 상차시간과 동일. 내일인 경우 설정한 시간
        endPlanMinute: endMinuteValue || "00",
      };

      onComplete(returnObj);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between py-3">
      <div className="h-full grid grid-rows-2">
        <div className="flex flex-col pb-5 border-b border-dashed">
          <p className="text-xl font-bold">상차일을 설정하세요.</p>
          <div className="grid grid-cols-2 gap-x-3 mt-3">
            <div
              className={
                "flex justify-center gap-x-2 p-5 text-lg rounded-md border border-gray-300 " +
                (startNowCheck.checked && "text-blue-600 border-blue-600")
              }
              onClick={() => {
                startTodayCheck.setChecked(false);
                startNowCheck.onClick();
              }}
            >
              <input
                type="checkbox"
                checked={startNowCheck.checked}
                onChange={() => {}}
              />
              <span>지금</span>
            </div>
            <div
              className={
                "flex justify-center gap-x-2 p-5 text-lg rounded-md border border-gray-300 " +
                (startTodayCheck.checked && "text-blue-600 border-blue-600")
              }
              onClick={() => {
                startNowCheck.setChecked(false);
                startTodayCheck.onClick();
              }}
            >
              <input
                type="checkbox"
                checked={startTodayCheck.checked}
                onChange={() => {}}
              />
              <span>당일</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 items-center justify-between w-full gap-x-3">
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100 disabled:text-gray-400"
              value={startAmPmValue}
              onChange={handleStartAmPm}
              disabled={disableStartTime}
            >
              {/*<option value="unset">오전 / 오후</option>*/}
              <option value="0">오전</option>
              <option value="12">오후</option>
            </select>
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100 disabled:text-gray-400"
              value={startHourValue}
              onChange={handleStartHour}
              disabled={disableStartTime}
            >
              <option value="">- 시 -</option>
              {startAmPmValue != "" &&
                Array.from(Array(12).keys()).map((val) => {
                  const convVal = val + Number.parseInt(startAmPmValue);
                  const nm = convVal.toString().padStart(2, "0");
                  if (
                    convVal >=
                    Number(getNextHourHH(1) == "00" ? "24" : getNextHourHH(1))
                  ) {
                    return (
                      <option key={val} value={nm}>
                        {nm}
                      </option>
                    );
                  }
                })}
            </select>
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100 disabled:text-gray-400"
              value={startMinuteValue}
              onChange={handleStartMinute}
              disabled={disableStartTime}
            >
              <option value="">- 분 -</option>
              {!isEmpty(startHourValue) != "" && (
                <>
                  <option value="00">00</option>
                  <option value="30">30</option>
                </>
              )}
            </select>
          </div>
        </div>
        <div className="flex flex-col pt-5">
          <p className="text-xl font-bold">하차일을 설정하세요.</p>
          <div className="grid grid-cols-2 gap-x-3 mt-3">
            <div
              className={
                "flex justify-center gap-x-2 p-5 text-lg rounded-md border border-gray-300 " +
                (endTodayCheck.checked && "text-blue-600 border-blue-600")
              }
              onClick={() => {
                endTommCheck.setChecked(false);
                endTodayCheck.onClick();
              }}
            >
              <input
                type="checkbox"
                checked={endTodayCheck.checked}
                onChange={() => {}}
              />
              <span>당착</span>
            </div>
            <div
              className={
                "flex justify-center gap-x-2 p-5 text-lg rounded-md border border-gray-300 " +
                (endTommCheck.checked && "text-blue-600 border-blue-600")
              }
              onClick={() => {
                endTodayCheck.setChecked(false);
                endTommCheck.onClick();
              }}
            >
              <input
                type="checkbox"
                checked={endTommCheck.checked}
                onChange={() => {}}
              />
              <span>내일</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 items-center justify-between w-full gap-x-3">
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100 disabled:text-gray-400"
              value={endAmPmValue}
              onChange={handleEndAmPm}
              disabled={disableEndTime}
            >
              {/*<option value="unset">오전 / 오후</option>*/}
              <option value="0">오전</option>
              <option value="12">오후</option>
            </select>
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100 disabled:text-gray-400"
              value={endHourValue}
              onChange={handleEndHour}
              disabled={disableEndTime}
            >
              <option value="">- 시 -</option>
              {endAmPmValue != "" &&
                Array.from(Array(12).keys()).map((val) => {
                  const convVal = val + Number.parseInt(endAmPmValue);
                  const nm = convVal.toString().padStart(2, "0");
                  return (
                    <option key={val} value={nm}>
                      {nm}
                    </option>
                  );
                })}
            </select>
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100 disabled:text-gray-400"
              value={endMinuteValue}
              onChange={handleEndMinute}
              disabled={disableEndTime}
            >
              <option value="">- 분 -</option>
              {!isEmpty(endHourValue) && (
                <>
                  <option value="00">00</option>
                  <option value="30">30</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>
      <div className="text-center pt-10 grid grid-cols-2 w-full gap-x-3">
        <button
          type="button"
          className="rounded-md bg-normalGray px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          onClick={onCancel}
        >
          닫기
        </button>
        <button
          type="button"
          className="rounded-md bg-mainBlue px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
          onClick={handleSelect}
        >
          선택
        </button>
      </div>
    </div>
  );
};

export default TodayTimeSelectModal;
