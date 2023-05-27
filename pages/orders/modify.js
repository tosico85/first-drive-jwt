import Seo from "../components/Seo";
import { useRouter } from "next/router";
import OrderForm from "../components/forms/OrderForm";
import { useEffect, useState } from "react";

export default function OrderModify() {
  const router = useRouter();
  const [modifyData, setModifyData] = useState(router.query || {});

  return (
    <div className="py-6">
      <Seo title="화물 등록" />

      <OrderForm isEdit={true} editData={modifyData} />
    </div>
  );
}
