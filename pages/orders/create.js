import Seo from "../components/Seo";
import { useRouter } from "next/router";
import OrderForm from "../components/forms/OrderForm";
import Script from "next/script";

export default function OrderCreate() {
  const router = useRouter();

  return (
    <div className="h-full py-6">
      <Seo title="화물 등록" />

      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" />
      <OrderForm />
    </div>
  );
}
