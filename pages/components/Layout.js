import { useRouter } from "next/router";
import Navbar from "./NavBar";

const Layout = ({ children }) => {
  const router = useRouter();

  return (
    <div>
      {router.pathname !== "/login" && <Navbar />}
      <main>{children}</main>
    </div>
  );
};

export default Layout;
