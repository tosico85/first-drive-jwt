import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { format, parse } from "date-fns";

function DateInput({
  onDateChange,
  dateValue,
  title,
  addClass = "",
  disabled = false,
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const datePickerRef = useRef();

  const handleSvgClick = () => {
    console.log(datePickerRef.current);
    datePickerRef.current.handleFocus();
  };

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
    <div className={"relative " + addClass}>
      <span>{title}</span>
      <DatePicker
        ref={datePickerRef}
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="yyyy-MM-dd"
        disabled={disabled}
        className={
          "rounded-md lg:rounded-sm border-0 py-3 px-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 lg:ring-0 lg:focus:ring-0 lg:focus:bg-mainInputFocusColor lg:bg-mainInputColor lg:outline-none focus:ring-mainColor2 lg:text-sm lg:leading-6 " +
          addClass
        }
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6 absolute top-3 right-2 text-gray-400"
        onClick={handleSvgClick}
      >
        <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
        <path
          fillRule="evenodd"
          d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
          clipRule="evenodd"
        />
      </svg>
      <style jsx global>
        {`
          .react-datepicker-wrapper {
            width: 100%;
          }
        `}
      </style>
    </div>
  );
}

export default DateInput;
