import { useContext, useEffect, useRef, useState } from "react";
import apiPaths from "../../../services/apiRoutes";

export default function SearchAddressModal({ onCancel, onComplete }) {
  const searchContentRef = useRef(null);

  useEffect(() => {
    searchAddress();
  }, []);

  /**
   * @title 주소 검색
   * @param {상하차 구분} startEnd
   */
  function searchAddress() {
    const element_layer = document.createElement("div");
    element_layer.style.width = "100%";
    element_layer.style.height = "100%";

    new daum.Postcode({
      oncomplete: function (data) {
        console.log(data);
        let {
          sido,
          sigungu,
          bname1,
          bname2,
          buildingName,
          jibunAddress,
          autoJibunAddress,
        } = data;

        let convSido = sido?.substring(0, 2); //시/도는 무조건 앞 2글자
        let splitSigungu = sigungu?.split(" ");
        let convGugun = splitSigungu.shift(); //시군구의 첫번째 단어만 시/군 항목으로 사용

        jibunAddress = jibunAddress == "" ? autoJibunAddress : jibunAddress; //지번이 없는 경우도 있음
        let bunji = jibunAddress.split(" ").pop(); //마지막에 있는 번수 가오

        //세종시 예외처리
        if (convSido == "세종") {
          convGugun = sido.substring(2); //'특별자치시'
        }

        //시군구 데이터 정제
        const pattern = /^(.*?)(시|군|구)$/;
        if (!/^(동구|남구|북구|서구|중구)$/i.test(convGugun)) {
          convGugun = convGugun.replace(pattern, "$1");
        }
        //console.log("splitSigungu", splitSigungu);

        //동 데이터 만들기. 시군구 앞단어 빼고 나머지, 법정동1, 2 합쳐서 처리
        const extraSigungu = splitSigungu.join(" ");
        let convDong = [extraSigungu, bname1, bname2]
          .join(" ")
          .replace("  ", " ")
          .trim();

        console.log("convSido", convSido);
        console.log("convGugun", convGugun);
        console.log("convDong", convDong);

        onComplete({
          wide: convSido,
          sgg: convGugun,
          dong: convDong,
          detail: `${bunji} ${buildingName}`,
          baseYn: "N",
        });
      },
      width: "100%",
      height: "100%",
    }).embed(element_layer);

    searchContentRef.current.appendChild(element_layer);
  }

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full h-full" ref={searchContentRef}></div>
      <div className="text-center pt-5">
        <button
          type="button"
          className="ml-3 rounded-md bg-normalGray px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          onClick={onCancel}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

//https://business.juso.go.kr/addrlink/addrLinkUrl.do?confmKey=U01TX0FVVEgyMDIzMDYxNDIwMTY0NDExMzg1MDQ=&resultType=1&returnUrl=http://localhost:3000/login
