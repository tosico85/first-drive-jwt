import { useContext } from "react";
import Seo from "./components/Seo";
import apiPaths from "./services/apiRoutes";
import AuthContext from "./context/authContext";

const HomePage = () => {
  const { isAuthenticated } = useContext(AuthContext);

  const getOrderList = async () => {
    const url = apiPaths.custReqGetCargoOrder;
    const params = {};

    const result = await requestServer(url, params);
    setCargoOrder(() => result);
    //console.log("Cargo order >>", cargoOrder);
  };

  return (
    <>
      <h1>Welcome to the Main Page</h1>
      {isAuthenticated ? (
        <p>로그인한 사용자에게만 표시되는 기능이나 컨텐츠</p>
      ) : (
        <p>로그인이 필요한 기능이나 컨텐츠</p>
      )}
    </>
  );
};

export default HomePage;
