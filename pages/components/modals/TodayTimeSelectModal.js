import { useState } from "react";

const TodayTimeSelectModal = ({ onCancel }) => {
  const [startAmPmValue, setStartAmPmValue] = useState("");
  const [startHourValue, setStartHourValue] = useState("");
  const [startMinuteValue, setStartMinuteValue] = useState("");
  const [endAmPmValue, setEndAmPmValue] = useState("");
  const [endHourValue, setEndHourValue] = useState("");
  const [endMinuteValue, setEndMinuteValue] = useState("");

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
    setStartAmPmValue(value);
  };

  const handleEndHour = (e) => {
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

  const handleEndMinute = (e) => {
    const {
      target: { value },
    } = e;
    setStartMinuteValue(value);
  };

  // 선택 이벤트
  const handleSelect = () => {};

  return (
    <div className="h-full flex flex-col justify-between py-3">
      <div className="h-full grid grid-rows-2">
        <div className="flex flex-col pb-5 border-b border-dashed">
          <p className="text-xl font-bold">상차일을 설정하세요.</p>
          <div className="grid grid-cols-2 gap-x-3 mt-3">
            <div className="flex justify-center gap-x-2 p-3 rounded-md border border-gray-300">
              <input type="checkbox" />
              <span>지금</span>
            </div>
            <div className="flex justify-center gap-x-2 p-3 rounded-md border border-gray-300">
              <input type="checkbox" />
              <span>당일</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 items-center justify-between w-full gap-x-3">
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
              value={startAmPmValue}
              onChange={handleStartAmPm}
            >
              <option value="">오전 / 오후</option>
              <option value="0">오전</option>
              <option value="12">오후</option>
            </select>
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
              value={startHourValue}
              onChange={handleStartHour}
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
            <div className="flex justify-center gap-x-2 p-3 rounded-md border border-gray-300">
              <input type="checkbox" />
              <span>지금</span>
            </div>
            <div className="flex justify-center gap-x-2 p-3 rounded-md border border-gray-300">
              <input type="checkbox" />
              <span>당일</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 items-center justify-between w-full gap-x-3">
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
              value={endAmPmValue}
              onChange={handleEndAmPm}
            >
              <option value="">오전 / 오후</option>
              <option value="0">오전</option>
              <option value="12">오후</option>
            </select>
            <select
              className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
              value={endHourValue}
              onChange={handleEndHour}
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
