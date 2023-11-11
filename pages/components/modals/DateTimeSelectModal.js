import React, { useEffect, useState } from "react";
import "react-calendar/dist/Calendar.css"; // css import
import CustomCalendar from "../custom/Calendar";
import { isEmptyObject } from "../../../utils/ObjectUtils";
import moment from "moment/moment";
import { useRadio } from "../../../hooks/useInput";
import { getDayByDateYYYYMMDD } from "../../../utils/StringUtils";
import { getNextHourHH, isEmpty } from "../../../utils/StringUtils";
const DateTimeSelectModal = ({
  onCancel,
  onComplete /* , startEnd */,
  paramObj,
}) => {
  const [dateValue, setDateValue] = useState(new Date());
  const [amPmValue, setAmPmValue] = useState("");
  const [hourValue, setHourValue] = useState("");
  const [minuteValue, setMinuteValue] = useState("");

  // 상하차 시간 변수
  const [startAmPmValue, setStartAmPmValue] = useState("");
  const [startHourValue, setStartHourValue] = useState("");
  const [startMinuteValue, setStartMinuteValue] = useState("");
  const [endAmPmValue, setEndAmPmValue] = useState("");
  const [endHourValue, setEndHourValue] = useState("");
  const [endMinuteValue, setEndMinuteValue] = useState("");

  //하차일 당착/내일 기능 추가(20231103)
  const endTodayCheck = useRadio(true);
  const endTommCheck = useRadio(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  useEffect(() => {
    console.log("paramObj", paramObj);
    if (!isEmptyObject(paramObj)) {
      const planDt = paramObj["PlanDt"];
      const planHour = paramObj["PlanHour"];
      const planMinute = paramObj["PlanMinute"];

      // 하차일 당착/내일 선택
      endTodayCheck.setChecked(paramObj["isEndToday"]);
      endTommCheck.setChecked(!paramObj["isEndToday"]);

      if (planDt != "") {
        try {
          const dateObject = moment(planDt, "YYYYMMDD").toDate();
          setDateValue(dateObject);

          if (planHour != "") {
            setAmPmValue(Number.parseInt(planHour) > 11 ? "12" : "0");
            setHourValue(planHour); //시
            setMinuteValue(planMinute); //분
          }
        } catch (e) {}
      }
    }
  }, []);

  const handleAmPm = (e) => {
    const {
      target: { value },
    } = e;
    setAmPmValue(value);
  };

  const handleHour = (e) => {
    const {
      target: { value },
    } = e;
    setHourValue(value);

    if (value != "") {
      if (minuteValue == "") {
        setMinuteValue("00");
      }
    }
  };

  const handleMinute = (e) => {
    const {
      target: { value },
    } = e;
    setMinuteValue(value);
  };

  const handleSelect = () => {
    if (startHourValue !== "" && startMinuteValue !== "") {
      if (endHourValue !== "" && endMinuteValue !== "") {
        if (
          moment(dateValue).format("YYYYMMDD") > moment().format("YYYYMMDD")
        ) {
          // Check if endHourValue is greater than startHourValue when endTodayCheck is checked
          if (endTodayCheck.checked && endHourValue < startHourValue) {
            alert("하차시간이 상차시간보다 늦어야 합니다.");
            return; // Exit the function if the condition is not met
          }

          let retVal = {};
          retVal[`startPlanDt`] = moment(dateValue).format("YYYYMMDD");
          retVal[`startPlanHour`] = startHourValue;
          retVal[`startPlanMinute`] = startMinuteValue;
          retVal[`endPlanDt`] = endTodayCheck.checked
            ? moment(dateValue).format("YYYYMMDD")
            : getDayByDateYYYYMMDD(moment(dateValue).format("YYYYMMDD"), 1);
          retVal[`endPlanHour`] = endHourValue;
          retVal[`endPlanMinute`] = endMinuteValue;

          onComplete(retVal);
        } else {
          alert("날짜를 선택해주세요.");
        }
      } else {
        alert("하차시간을 선택해주세요.");
      }
    } else {
      alert("상차시간을 선택해주세요.");
    }
  };

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

  // 상하차 시간 disabled제어 변수
  const [disableStartTime, setDisableStartTime] = useState(false);
  const [disableEndTime, setDisableEndTime] = useState(false);

  return (
    <div className="h-full flex flex-col items-center justify-between">
      <div className="flex flex-col">
        <p className="mb-5 text-xl font-bold text-left">예약일을 설정하세요</p>
        <CustomCalendar
          value={dateValue}
          onChange={setDateValue}
          minDate={minDate}
        />

        <div className="mt-5 grid grid-cols-3 items-center justify-between w-full gap-x-3">
          <select
            className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100 disabled:text-gray-400"
            value={startAmPmValue}
            onChange={handleStartAmPm}
            disabled={disableStartTime}
          >
            <option value="unset">선택</option>
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
            {startAmPmValue !== "" &&
              Array.from(Array(12).keys()).map((val) => {
                const displayHour = startAmPmValue === "0" ? val : val + 12;
                const displayHourText = displayHour.toString().padStart(2, "0");
                const amPm = startAmPmValue === "0" ? "오전" : "오후";
                const nm = displayHourText;
                return (
                  <option key={val} value={nm}>
                    {displayHourText}
                  </option>
                );
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

        <div className="w-full border-b border-gray-100 my-5"></div>
        <div className="grid grid-cols-3 items-center justify-between w-full gap-x-3">
          {/* ... */}
        </div>
        <div>
          <div className="grid grid-cols-2 gap-x-3 mt-3">
            <div
              className={
                "flex justify-center gap-x-2 py-2 px-5 text-lg rounded-md border border-gray-300 " +
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
                "flex justify-center gap-x-2 py-2 px-5 text-lg rounded-md border border-gray-300 " +
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
              *<option value="unset">선택</option>
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
      <div className="text-center pt-2 grid grid-cols-2 w-full gap-x-3">
        <button
          type="button"
          className="rounded-md bg-normalGray px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          onClick={onCancel}
        >
          닫기
        </button>
        <button
          type="button"
          className="rounded-md bg-mainBlue px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
          onClick={handleSelect}
        >
          선택
        </button>
      </div>
    </div>
  );
};

export default DateTimeSelectModal;
