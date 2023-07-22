import moment from "moment";
import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // css import

const CustomCalendar = (prop) => {
  return (
    <div className="w-full flex flex-col items-center">
      <Calendar
        formatDay={(locale, date) => moment(date).format("D")}
        minDate={new Date()}
        {...prop}
      />
      <style jsx global>{`
        .react-calendar {
          width: 100%;
          max-width: 500px;
          background-color: #fff;
          border: none;
          color: #222;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.125em;
        }
        .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          font-size: 16px;
          margin-top: 8px;
          font-weight: bold;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: #f8f8fa;
        }
        .react-calendar__navigation button[disabled] {
          background-color: #f0f0f0;
        }
        abbr[title] {
          text-decoration: none;
        }
        /*
        .react-calendar__month-view__days button {
          border: 1px solid #dadada;
          border-radius: 6px;
        }*/
        .react-calendar__tile:disabled {
          color: #c0c0c0;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background: #f8f8fa;
          color: #2e58eb;
          border-radius: 6px;
        }
        .react-calendar__tile--now {
          background: #2e58eb33;
          border-radius: 6px;
          font-weight: bold;
          color: #2e58eb;
        }
        .react-calendar__tile--now:enabled:hover,
        .react-calendar__tile--now:enabled:focus {
          background: #2e58eb33;
          border-radius: 6px;
          font-weight: bold;
          color: #2e58eb;
        }
        .react-calendar__tile--hasActive:enabled:hover,
        .react-calendar__tile--hasActive:enabled:focus {
          background: #f8f8fa;
        }
        .react-calendar__tile--active {
          background: #2e58eb;
          border-radius: 6px;
          font-weight: bold;
          color: white;
        }
        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus {
          background: #2e58eb;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default CustomCalendar;
