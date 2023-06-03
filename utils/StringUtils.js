export const formatDate = (inputDate) => {
  if (!inputDate) {
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
  return obj || "" == "";
};
