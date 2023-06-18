import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { format, parse } from "date-fns";

function DateInput({ onDateChange, dateValue, title }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (dateValue) {
      try {
        const dateObject = parse(dateValue, "yyyyMMdd", new Date());
        setSelectedDate(dateObject);
      } catch (e) {}
    }
  }, [dateValue]);

  const handleDateChange = (date) => {
    //console.log(date);
    try {
      const formattedDate = format(date, "yyyyMMdd");
      setSelectedDate(date);
      onDateChange(formattedDate);
    } catch (e) {}
  };

  return (
    <div className="z-1">
      <span>{title}</span>
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="yyyy-MM-dd"
        className="block rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
      />
    </div>
  );
}

export default DateInput;
