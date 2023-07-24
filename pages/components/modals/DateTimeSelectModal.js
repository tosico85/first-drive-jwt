import React, { useEffect, useState } from "react";
import "react-calendar/dist/Calendar.css"; // css import
import CustomCalendar from "../custom/Calendar";
import moment from "moment";
import { isEmptyObject } from "../../../utils/ObjectUtils";

const DateTimeSelectModal = ({ onCancel, onComplete, startEnd, paramObj }) => {
  const [dateValue, setDateValue] = useState(new Date());
  const [amPmValue, setAmPmValue] = useState("");
  const [hourValue, setHourValue] = useState("");
  const [minuteValue, setMinuteValue] = useState("");

  useEffect(() => {
    console.log("paramObj", paramObj);
    if (!isEmptyObject(paramObj)) {
      const planDt = paramObj["PlanDt"];
      const planHour = paramObj["PlanHour"];
      const planMinute = paramObj["PlanMinute"];

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
      retVal[`${startEnd}PlanDt`] = moment(dateValue).format("YYYYMMDD");
      retVal[`${startEnd}PlanHour`] = hourValue;
      retVal[`${startEnd}PlanMinute`] = minuteValue;

      onComplete(retVal);
    } else {
      alert("시/분을 입력해주세요.");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <CustomCalendar value={dateValue} onChange={setDateValue} />
      <div className="w-full border-b border-gray-100 my-5"></div>
      <div className="grid grid-cols-3 items-center justify-between w-full p-3 gap-x-3">
        <select
          className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
          value={amPmValue}
          onChange={handleAmPm}
        >
          <option value="">오전 / 오후</option>
          <option value="0">오전</option>
          <option value="12">오후</option>
        </select>
        <select
          className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
          value={hourValue}
          onChange={handleHour}
        >
          <option value="">- 시 -</option>
          {amPmValue != "" &&
            Array.from(Array(12).keys()).map((val) => {
              const convVal = val + Number.parseInt(amPmValue);
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
          value={minuteValue}
          onChange={handleMinute}
        >
          <option value="">- 분 -</option>
          <option value="00">00</option>
          <option value="30">30</option>
        </select>
      </div>
      <div className="text-center pt-10">
        <button
          type="button"
          className="rounded-md bg-mainBlue px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
          onClick={handleSelect}
        >
          선택
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

export default DateTimeSelectModal;
