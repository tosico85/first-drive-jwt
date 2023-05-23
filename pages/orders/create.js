import Seo from "../components/Seo";
import { useRouter } from "next/router";
import OrderForm from "../components/forms/OrderForm";

export default function OrderCreate() {
  const router = useRouter();

  return (
    <div>
      <Seo title="화물 등록" />
      <h1>화물 등록</h1>

      <OrderForm />
    </div>
  );
}
