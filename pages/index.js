import { useContext, useEffect, useState } from "react";
import apiPaths from "../services/apiRoutes";
import Link from "next/link";
import AuthContext from "./context/authContext";

const HomePage = () => {
  const { requestServer } = useContext(AuthContext);
  const [cargoOrder, setCargoOrder] = useState([]);

  const getOrderList = async () => {
    const url = apiPaths.custReqGetCargoOrder;
    const params = {};

    const result = await requestServer(url, params);
    setCargoOrder(() => result);
    console.log("Cargo order >>", cargoOrder);
  };

  useEffect(() => {
    (async () => {
      await getOrderList();
    })();
  }, []);

  return (
    <>
      <h1 className="text-blue-600">Welcome to the Main Page</h1>
      <p>현재 등록 중인 화물 건입니다.</p>
      <ul>
        {cargoOrder.length > 0 &&
          cargoOrder.map((item) => {
            const {
              cargo_seq,
              cargoDsc,
              cargoTon,
              create_dtm,
              ordNo,
              ordStatus,
              truckType,
              updateDt,
              urgent,
            } = item;
            return (
              <li key={item.cargo_seq}>
                <Link
                  href={{
                    pathname: `/orders/detail`,
                    query: { param: `${item.cargo_seq}` },
                  }}
                >
                  <a>
                    {`${cargo_seq} ${cargoDsc} ${cargoTon} ${create_dtm} ${ordNo} ${ordStatus} ${truckType} ${updateDt} ${urgent}`}
                  </a>
                </Link>
              </li>
            );
          })}
      </ul>
      <div>
        <Link
          href={{
            pathname: `/orders/create`,
          }}
        >
          <a>화물 등록</a>
        </Link>
      </div>
    </>
  );
};

export default HomePage;
