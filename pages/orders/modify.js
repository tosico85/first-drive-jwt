import Seo from "../components/Seo";
import { useRouter } from "next/router";
import OrderForm from "../components/forms/OrderForm";
import { useEffect, useState } from "react";

export default function OrderModify() {
  const router = useRouter();
  const [modifyData, setModifyData] = useState(router.query || {});

  return (
    <div>
      <Seo title="화물 등록" />
      <h1>화물 수정</h1>

      <OrderForm isEdit={true} editData={modifyData} />
    </div>
  );
}
