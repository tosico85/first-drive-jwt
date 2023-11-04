import React, { useEffect, useState } from "react";
import "react-calendar/dist/Calendar.css"; // css import
import CustomCalendar from "../custom/Calendar";
import { isEmptyObject } from "../../../utils/ObjectUtils";
import moment from "moment/moment";
import { useRadio } from "../../../hooks/useInput";
import { getDayByDateYYYYMMDD } from "../../../utils/StringUtils";

const DateTimeSelectModal = ({
  onCancel,
  onComplete /* , startEnd */,
  paramObj,
}) => {
  const [dateValue, setDateValue] = useState(new Date());
  const [amPmValue, setAmPmValue] = useState("");
  const [hourValue, setHourValue] = useState("");
  const [minuteValue, setMinuteValue] = useState("");

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
    if (hourValue != "" && minuteValue != "") {
      let retVal = {};
      // retVal[`${startEnd}PlanDt`] = moment(dateValue).format("YYYYMMDD");
      // retVal[`${startEnd}PlanHour`] = hourValue;
      // retVal[`${startEnd}PlanMinute`] = minuteValue;
      retVal[`startPlanDt`] = moment(dateValue).format("YYYYMMDD");
      retVal[`startPlanHour`] = hourValue;
      retVal[`startPlanMinute`] = minuteValue;
      retVal[`endPlanDt`] = endTodayCheck.checked
        ? moment(dateValue).format("YYYYMMDD")
        : getDayByDateYYYYMMDD(moment(dateValue).format("YYYYMMDD"), 1);
      retVal[`endPlanHour`] = endTodayCheck.checked ? hourValue : "00";
      retVal[`endPlanMinute`] = endTodayCheck.checked ? minuteValue : "00";

      onComplete(retVal);
    } else {
      alert("시/분을 입력해주세요.");
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-between">
      <div className="flex flex-col">
        <p className="mb-5 text-xl font-bold text-left">예약일을 설정하세요</p>
        <CustomCalendar
          value={dateValue}
          onChange={setDateValue}
          minDate={minDate}
        />
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
        </div>
      </div>
      <div className="text-center pt-5 grid grid-cols-2 w-full gap-x-3">
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
