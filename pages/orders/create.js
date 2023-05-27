import Seo from "../components/Seo";
import { useRouter } from "next/router";
import OrderForm from "../components/forms/OrderForm";

export default function OrderCreate() {
  const router = useRouter();

  return (
    <div className="h-full py-6">
      <Seo title="화물 등록" />

      <OrderForm />
    </div>
  );
}
