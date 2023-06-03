import Seo from "../components/Seo";
import { useRouter } from "next/router";
import OrderForm from "../components/forms/OrderForm";

export default function OrderModify() {
  const router = useRouter();
  const { serializedQuery } = router.query;

  // 쿼리 문자열을 객체로 변환
  console.log(router.query);
  const queryObject = JSON.parse(decodeURIComponent(serializedQuery));

  return (
    <div className="py-6">
      <Seo title="화물 수정" />

      <OrderForm
        isEdit={true}
        editData={queryObject.cargoOrder || {}}
        isDirectApi={queryObject.isDirectApi || false}
      />
    </div>
  );
}
