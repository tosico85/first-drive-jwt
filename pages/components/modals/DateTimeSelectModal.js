import moment from "moment";
import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // css import
import CustomCalendar from "../custom/Calendar";
import DateInput from "../custom/DateInput";

const DateTimeSelectModal = () => {
  const [dateValue, setDateValue] = useState(new Date());

  useEffect(() => {
    //setDateValue(dateValue.setMonth(dateValue.getMonth() + 1));
    console.log(dateValue);
  }, [dateValue]);

  return (
    <div className="flex flex-col items-center">
      <CustomCalendar value={dateValue} onChange={setDateValue} />
      <input type="text" />
    </div>
  );
};

export default DateTimeSelectModal;
