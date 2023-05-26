import { useRouter } from "next/router";
import Navbar from "./NavBar";

const Layout = ({ children }) => {
  const router = useRouter();
  const isLogin = router.pathname === "/login";

  return (
    <div className="h-full">
      {!isLogin && <Navbar />}
      <main className={isLogin ? "h-full" : "h-max"}>
        <div
          className={
            "h-full mx-auto max-w-7xl px-5 lg:px-8 " +
            (isLogin ? "-mt-36" : "pt-36")
          }
        >
          {/* <div className="h-full mx-auto max-w-7xl px-5 lg:px-8 pt-36"> */}
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
