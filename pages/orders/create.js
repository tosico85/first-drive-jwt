import Seo from "../components/Seo";
import { useRouter } from "next/router";
import OrderForm from "../components/forms/OrderForm";
import Script from "next/script";
import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/authContext";

export default function OrderCreate() {
  const router = useRouter();
  const { serializedQuery } = router.query;
  const { userInfo } = useContext(AuthContext);

  let editData = {};
  let isCopy = false;

  // 쿼리 문자열을 객체로 변환
  if (serializedQuery) {
    isCopy = true;
    editData = JSON.parse(decodeURIComponent(serializedQuery));
  }

  return (
    <div className="h-full py-6">
      <Seo title="화물 등록" />

      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" />
      <OrderForm
        editData={editData.cargoOrder}
        isCopy={isCopy}
        isEdit={false}
        userInfo={userInfo}
      />
    </div>
  );
}
