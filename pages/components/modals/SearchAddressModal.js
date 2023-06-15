import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";

export default function SearchAddressModal({ startEnd, onCancel, onComplete }) {
  useEffect(() => {
    console.log(apiPaths.apiJusoUrl);
  }, []);

  return <></>;
}

//https://business.juso.go.kr/addrlink/addrLinkUrl.do?confmKey=U01TX0FVVEgyMDIzMDYxNDIwMTY0NDExMzg1MDQ=&resultType=1&returnUrl=http://localhost:3000/login
