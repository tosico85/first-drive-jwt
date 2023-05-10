import apiPaths from "./apiRoutes";
import axios from "axios";

export const requestServer = async (path, params) => {
  const requestUrl = `${apiPaths.baseUrl}${path}`;
  let result = {};
  try {
    const { data, status, statusText } = await axios.post(requestUrl, params, {
      //const result = await axios.post(requestUrl, params, {
      withCredentials: true,
    });
    if (status === 200) {
      result = data;
      //console.log(result);
    } else {
      result = { result: statusText };
    }
  } catch (error) {
    console.log(error);
  }

  console.log(result);
  return result;
};
