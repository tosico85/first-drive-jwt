import { useContext, useEffect } from "react";
import Navbar from "./NavBar";
import AuthContext from "../context/authContext";

const Layout = ({ children }) => {
  const { sessionCheck } = useContext(AuthContext);

  useEffect(() => {
    sessionCheck();
  }, []);

  return (
    <div>
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

export default Layout;
