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

// 시간(hh)을 가져오는 함수
export const getNextHourHH = (addHour = 0) => {
  const today = moment(); // 현재 날짜와 시간을 가져옵니다.
  const futureTime = today.add(addHour, "hours"); // 현재 시간에 addHour 시간을 더합니다.
  const hh = futureTime.format("hh"); // 현재 시간 이후의 시간(hh)을 가져옵니다.
  return hh;
};
