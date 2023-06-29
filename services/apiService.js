import apiPaths from "./apiRoutes";
import axios from "axios";

export const callServer = async (path, params) => {
  const requestUrl = `${apiPaths.baseUrl}${path}`;
  let result = {};
  try {
    const { data, status, statusText } = await axios.post(requestUrl, params, {
      //const result = await axios.post(requestUrl, params, {
      method: "POST",
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
        "Access-Control-Allow-Headers":
          "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
      },
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

  //console.log(result);
  return result;
};
