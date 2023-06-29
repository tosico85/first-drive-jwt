import apiPaths from "./apiRoutes";
import axios from "axios";

export const callServer = async (path, params) => {
  const requestUrl = `${apiPaths.baseUrl}${path}`;
  let result = {};
  try {
    //const { data, status, statusText } =
    /* await axios.post(requestUrl, params, {
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
    }); */
    /* await axios({
        method: "post",
        url: requestUrl,
        data: params,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        withCredentials: true,
        credentials: "include",
      }); */
    const response = await fetch(requestUrl, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "include", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(params), // body data type must match "Content-Type" header
    });
    const json = await response.json();
    console.log(response);

    if (response.status === 200) {
      result = json;
      //console.log(result);
    } else {
      result = { result: response.statusText };
    }
  } catch (error) {
    console.log(error);
  }

  //console.log(result);
  return result;
};
