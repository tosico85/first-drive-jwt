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

  const handleModify = (e) => {
    e.preventDefault();

    if (cargoOrder.ordNo?.length > 0) {
      alert("배차신청된 오더는 수정이 불가합니다.");
    } else {
      router.push({
        pathname: e.target.href,
        query: cargoOrder,
      });
    }
  };

  return (
    <div>
      <Seo title={"화물 상세"} />
      <h1>화물 상세</h1>
      <div>{JSON.stringify(cargoOrder)}</div>
      <div>
        <Link
          href={{
            pathname: `/orders/modify`,
          }}
        >
          <a onClick={handleModify}>화물 수정</a>
        </Link>
      </div>
    </div>
  );
}
