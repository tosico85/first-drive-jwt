import { useState } from "react";
import DatePicker from "react-datepicker";
import { useFormContext } from "react-hook-form";

function DateInput({ title, name }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { register, setValue } = useFormContext();

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setValue(name, formatDate(date));
  };

  const formatDate = (date) => {
    const d = new Date(date);
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("");
  };

  return (
    <div>
      <span>{title}</span>
      <DatePicker
        {...register(name, { required: "날짜를 입력해주세요." })}
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat={"yyyy-MM-dd"}
      />
    </div>
  );
}

export default DateInput;
