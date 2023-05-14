import { useContext, useEffect, useState } from "react";
import Seo from "./components/Seo";
import apiPaths from "../services/apiRoutes";
import AuthContext from "./context/authContext";
import { requestServer } from "../services/apiService";

const HomePage = () => {
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
      <h1>Welcome to the Main Page</h1>
      <p>현재 등록 중인 화물 건입니다.</p>
    </>
  );
};

export default HomePage;
