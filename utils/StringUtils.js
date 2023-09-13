import moment from "moment";

export const formatDate = (inputDate) => {
  if (isEmpty(inputDate)) {
    return "";
  }

  const year = inputDate.substring(0, 4);
  const month = inputDate.substring(4, 6);
  const day = inputDate.substring(6, 8);

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
};

export const isNumber = (value) => {
  return (
    typeof value === "number" ||
    (typeof value === "string" && !isNaN(parseInt(value)))
  );
};

export const formatPhoneNumber = (inputData) => {
  if (!inputData) {
    return "";
  }

  let result = "";
  if (inputData.length === 11) {
    result = `${inputData.substring(0, 3)}-${inputData.substring(
      3,
      7
    )}-${inputData.substring(7, 11)}`;
  } else if (inputData) {
    result = `${inputData.substring(0, 2)}-${inputData.substring(
      2,
      6
    )}-${inputData.substring(6, 10)}`;
  } else {
    return "";
  }

  return result;
};

export const isEmpty = (obj) => {
  return (obj || "") == "";
};

export const addCommas = (number) => {
  if (typeof number === "number") {
    number = number.toString();
  } else {
    if (isEmpty(number)) return "";
  }
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const getTodayDate = () => {
  var today = new Date();

  var year = today.getFullYear().toString();
  var month = (today.getMonth() + 1).toString().padStart(2, "0");
  var day = today.getDate().toString().padStart(2, "0");

  return year + month + day;
};

export const getOneWeekAgoDate = () => {
  var today = new Date();
  var oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  var year = oneWeekAgo.getFullYear().toString();
  var month = (oneWeekAgo.getMonth() + 1).toString().padStart(2, "0");
  var day = oneWeekAgo.getDate().toString().padStart(2, "0");

  return year + month + day;
};

// 달 'yyyyMM' 반환
export const getMonthYYYYMM = (addMonth = 0) => {
  var currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() + addMonth);
  var year = currentDate.getFullYear();
  var month = currentDate.getMonth() + 1;

  if (month < 10) {
    month = "0" + month;
  }

  return year.toString() + month.toString();
};

// 날짜 'yyyyMMdd' 반환
export const getDayYYYYMMDD = (addDay = 0) => {
  var currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + addDay);
  var year = currentDate.getFullYear();
  var month = currentDate.getMonth() + 1;
  var day = currentDate.getDate();

  if (month < 10) {
    month = "0" + month;
  }

  if (day < 10) {
    day = "0" + day;
  }

  return year.toString() + month.toString() + day.toString();
};

/**
 * 특정 일자로부터 add 날짜 'yyyyMMdd' 반환
 * date : "yyyyMMdd" 필수
 **/
export const getDayByDateYYYYMMDD = (date, addDay = 0) => {
  var currentDate = new Date(formatDate(date));
  currentDate.setDate(currentDate.getDate() + addDay);
  var year = currentDate.getFullYear();
  var month = currentDate.getMonth() + 1;
  var day = currentDate.getDate();

  if (month < 10) {
    month = "0" + month;
  }

  if (day < 10) {
    day = "0" + day;
  }

  return year.toString() + month.toString() + day.toString();
};

// 시간(hh)을 가져오는 함수
export const getNextHourHH = (addHour = 0) => {
  const today = moment(); // 현재 날짜와 시간을 가져옵니다.
  const futureTime = today.add(addHour, "hours"); // 현재 시간에 addHour 시간을 더합니다.
  const hh = futureTime.format("HH"); // 현재 시간 이후의 시간(hh)을 가져옵니다.
  return hh;
};

export const convertTo12HourFormat = (hh) => {
  let time = hh;
  if (typeof hh == "string") {
    time = Number.parseInt(hh);
  }

  if (time >= 0 && time <= 23) {
    const hh = time < 10 ? "0" + time : "" + time;

    if (time <= 11) {
      return "오전 " + hh + "시";
    } else {
      return "오후 " + hh + "시";
    }
  } else {
    return "올바른 시간을 입력하세요 ('00'부터 '23' 사이)";
  }
};

//한 주의 월요일을 구하는 함수
function getMondayDate(addWeek = 0) {
  const today = new Date();
  today.setDate(today.getDate() + addWeek * 7);
  const dayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const thisMonday = new Date(today);

  const minusDay = dayOfWeek == 0 ? 6 : dayOfWeek - 1;
  thisMonday.setDate(today.getDate() - minusDay);

  const year = thisMonday.getFullYear();
  const month = String(thisMonday.getMonth() + 1).padStart(2, "0");
  const day = String(thisMonday.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

/**
 * type에 대한 기간 날짜 조회
 * - type: 1 : 오늘
 * - type: 2 : 어제
 * - type: 3 : 이번주
 * - type: 4 : 최근한주
 * - type: 5 : 지난주
 * - type: 6 : 이번달
 * - type: 7 : 최근한달
 * - type: 8 : 지난달
 *
 * @param {type} type
 * @returns
 */
export const getPeriodDate = (type = 1) => {
  let currentDate = new Date();
  let startDate = getTodayDate(),
    endDate = getTodayDate();

  if (type == 2) {
    //어제
    startDate = getDayYYYYMMDD(-1);
    endDate = getDayYYYYMMDD(-1);
  } else if (type == 3) {
    //이번주
    startDate = getMondayDate();
  } else if (type == 4) {
    //최근한주
    startDate = getOneWeekAgoDate();
  } else if (type == 5) {
    //지난주
    startDate = getMondayDate(-1);
    endDate = getDayYYYYMMDD(currentDate.getDay() * -1);
  } else if (type == 6) {
    //이번달
    startDate = getMonthYYYYMM() + "01";
  } else if (type == 7) {
    //최근한달
    startDate = getDayYYYYMMDD(-30);
  } else if (type == 8) {
    //지난달
    startDate = getMonthYYYYMM(-1) + "01";
    endDate = getDayByDateYYYYMMDD(getMonthYYYYMM() + "01", -1);
  }

  return { startDate, endDate };
};

/**
 * 운송료 지급일 조회
 * 오늘 날짜가 15일을 넘지 않았다면 15일
 * 15일을 넘었다면 이달 말일
 * 오늘이 말일이면 다음달 15일
 */
export const getPayPlanYmd = () => {
  const currentDate = new Date();
  const todayDate = currentDate.getDate();
  const lastDateOfThisMonth = getDayByDateYYYYMMDD(
    getMonthYYYYMM(1) + "01",
    -1
  );

  if (todayDate < 15) {
    return getMonthYYYYMM() + "15";
  } else if (lastDateOfThisMonth == getTodayDate()) {
    //오늘이 말일이면 다음달 15일
    return getMonthYYYYMM(1) + "15";
  } else {
    return lastDateOfThisMonth;
  }
};
