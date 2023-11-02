import React, { useEffect, useState } from "react";
import "react-calendar/dist/Calendar.css"; // css import
import CustomCalendar from "../custom/Calendar";
import { isEmptyObject } from "../../../utils/ObjectUtils";
import moment from "moment/moment";

const DateTimeSelectModal = ({
  onCancel,
  onComplete /* , startEnd */,
  paramObj,
}) => {
  const [dateValue, setDateValue] = useState(new Date());
  const [amPmValue, setAmPmValue] = useState("");
  const [hourValue, setHourValue] = useState("");
  const [minuteValue, setMinuteValue] = useState("");
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

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
      // retVal[`${startEnd}PlanDt`] = moment(dateValue).format("YYYYMMDD");
      // retVal[`${startEnd}PlanHour`] = hourValue;
      // retVal[`${startEnd}PlanMinute`] = minuteValue;
      retVal[`startPlanDt`] = moment(dateValue).format("YYYYMMDD");
      retVal[`startPlanHour`] = hourValue;
      retVal[`startPlanMinute`] = minuteValue;
      retVal[`endPlanDt`] = moment(dateValue).format("YYYYMMDD");
      retVal[`endPlanHour`] = hourValue;
      retVal[`endPlanMinute`] = minuteValue;

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
          <select
            className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
            value={amPmValue}
            onChange={handleAmPm}
          >
            {/*<option value="">오전 / 오후</option>*/}
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

export default DateTimeSelectModal;
