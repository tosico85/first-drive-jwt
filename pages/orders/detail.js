import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import { requestServer } from "../../services/apiService";
import Seo from "../components/Seo";

export default function Detail() {
  const router = useRouter();
  const [cargoOrder, setCargoOrder] = useState({});

  useEffect(() => {
    (async () => {
      const {
        query: { param: cargo_seq },
      } = router;

      const result = await requestServer(apiPaths.custReqGetCargoOrder, {
        cargo_seq,
      });
      console.log(result);

      if (result.length > 0) {
        setCargoOrder(() => result[0]);
      }
    })();
  }, []);

  return (
    <div>
      <Seo title={"화물 상세"} />
      <h1>화물 상세</h1>
      <div>{JSON.stringify(cargoOrder.cargoDsc)}</div>
    </div>
  );
}
