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
  }, []);

  const handleDateChange = (date) => {
    console.log(date);
    try {
      const formattedDate = format(date, "yyyyMMdd");
      setSelectedDate(date);
      onDateChange(formattedDate);
    } catch (e) {}
  };

  return (
    <div>
      <span>{title}</span>
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="yyyy-MM-dd"
      />
    </div>
  );
}

export default DateInput;
