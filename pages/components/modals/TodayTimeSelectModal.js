import { useState } from "react";
import { useRadio } from "../../../hooks/useInput";
import { useEffect } from "react";
import { isEmptyObject } from "../../../utils/ObjectUtils";
import { getDayYYYYMMDD, getNextHourHH } from "../../../utils/StringUtils";

const TodayTimeSelectModal = ({ onCancel, onComplete, paramObj }) => {
  // 상하차 시간 변수
  const [startAmPmValue, setStartAmPmValue] = useState("");
  const [startHourValue, setStartHourValue] = useState("");
  const [startMinuteValue, setStartMinuteValue] = useState("");
  const [endAmPmValue, setEndAmPmValue] = useState("");
  const [endHourValue, setEndHourValue] = useState("");
  const [endMinuteValue, setEndMinuteValue] = useState("");

  //checkbox 제어 변수
  const startNowCheck = useRadio(true);
  const startTodayCheck = useRadio(false);
  const endTodayCheck = useRadio(true);
  const endTommCheck = useRadio(false);

  // 상하차 시간 disabled제어 변수
  const [disableStartTime, setDisableStartTime] = useState(false);
  const [disableEndTime, setDisableEndTime] = useState(false);

  // 모달 팝업 로딩 event
  useEffect(() => {
    if (!isEmptyObject(paramObj)) {
      const { startPlanHour, endPlanDt } = paramObj;
      const isNowStart = startPlanHour <= getNextHourHH(1);
      const isTommEnd = endPlanDt == getDayYYYYMMDD(1);

      // 지금/당일 선택
      startNowCheck.setChecked(isNowStart);
      startTodayCheck.setChecked(!isNowStart);

      // 당착/내일 선택
      endTodayCheck.setChecked(!isTommEnd);
      endTommCheck.setChecked(isTommEnd);
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
  }, [startNowCheck, endTodayCheck]);

  /************* SelectBox Change Event ***********/
  const handleStartAmPm = (e) => {
    const {
      target: { value },
    } = e;
    setStartAmPmValue(value);
  };

  const handleStartHour = (e) => {
    const {
      target: { value },
    } = e;
    setStartHourValue(value);

    if (value != "") {
      if (startMinuteValue == "") {
        setStartMinuteValue("00");
      }
    }
  };

  const handleStartMinute = (e) => {
    const {
      target: { value },
    } = e;
    setStartMinuteValue(value);
  };

  const handleEndAmPm = (e) => {
    const {
      target: { value },
    } = e;
    setEndAmPmValue(value);
  };

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

  const handleEndMinute = (e) => {
    const {
      target: { value },
    } = e;
    setEndMinuteValue(value);
  };

  // 선택 이벤트
  const handleSelect = () => {};

  return (
    <div className="h-full flex flex-col justify-between py-3">
      <div className="h-full grid grid-rows-2">
        <div className="flex flex-col pb-5 border-b border-dashed">
          <p className="text-xl font-bold">상차일을 설정하세요.</p>
          <div className="grid grid-cols-2 gap-x-3 mt-3">
            <div
              className="flex justify-center gap-x-2 p-3 rounded-md border border-gray-300"
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
              className="flex justify-center gap-x-2 p-3 rounded-md border border-gray-300"
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
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
              value={startAmPmValue}
              onChange={handleStartAmPm}
              disabled={disableStartTime}
            >
              <option value="">오전 / 오후</option>
              <option value="0">오전</option>
              <option value="12">오후</option>
            </select>
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
              value={startHourValue}
              onChange={handleStartHour}
              disabled={disableStartTime}
            >
              <option value="">- 시 -</option>
              {startAmPmValue != "" &&
                Array.from(Array(12).keys()).map((val) => {
                  const convVal = val + Number.parseInt(startAmPmValue);
                  const nm = convVal.toString().padStart(2, "0");
                  return (
                    <option key={val} value={nm}>
                      {nm}
                    </option>
                  );
                })}
            </select>
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
              value={startMinuteValue}
              onChange={handleStartMinute}
              disabled={disableStartTime}
            >
              <option value="">- 분 -</option>
              <option value="00">00</option>
              <option value="30">30</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col pt-5">
          <p className="text-xl font-bold">하차일을 설정하세요.</p>
          <div className="grid grid-cols-2 gap-x-3 mt-3">
            <div
              className="flex justify-center gap-x-2 p-3 rounded-md border border-gray-300"
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
              className="flex justify-center gap-x-2 p-3 rounded-md border border-gray-300"
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
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
              value={endAmPmValue}
              onChange={handleEndAmPm}
              disabled={disableEndTime}
            >
              <option value="">오전 / 오후</option>
              <option value="0">오전</option>
              <option value="12">오후</option>
            </select>
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
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
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
              value={endMinuteValue}
              onChange={handleEndMinute}
              disabled={disableEndTime}
            >
              <option value="">- 분 -</option>
              <option value="00">00</option>
              <option value="30">30</option>
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
