import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import Seo from "../components/Seo";
import AuthContext from "../context/authContext";

export default function Detail() {
  const router = useRouter();
  const { requestServer } = useContext(AuthContext);
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
      <div>{JSON.stringify(cargoOrder)}</div>
      <div>
        <Link
          href={{
            pathname: `/orders/modify`,
            query: cargoOrder,
          }}
        >
          <a>화물 수정</a>
        </Link>
      </div>
    </div>
  );
}
