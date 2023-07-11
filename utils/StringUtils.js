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
