import Seo from "../components/Seo";
import { useRouter } from "next/router";
import OrderForm from "../components/forms/OrderForm";

export default function OrderModify() {
  const router = useRouter();
  //const [modifyData, setModifyData] = useState();

  return (
    <div className="py-6">
      <Seo title="화물 수정" />

      <OrderForm isEdit={true} editData={router.query || {}} />
    </div>
  );
}
