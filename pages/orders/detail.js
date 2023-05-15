import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import { requestServer } from "../../services/apiService";
import Seo from "../components/Seo";

export default function Detail({ params }) {
  const [cargoOrder, setCargoOrder] = useState({});
  const [cargo_seq] = params || [];

  useEffect(() => {
    (async () => {
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
    </div>
  );
}

export async function getServerSideProps({ params: { params } }) {
  return {
    props: { params },
  };
}
