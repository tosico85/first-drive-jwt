import { useRouter } from "next/router";
import localRoutes from "../../services/localRoutes";
import Navbar from "./NavBar";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";
import AuthContext from "../context/authContext";
import { useContext, useEffect, useState } from "react";

const Layout = ({ children }) => {
  const router = useRouter();
  const { sessionCheck, userInfo } = useContext(AuthContext);
  const isLoginPage = router.pathname === "/login";
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const isLoggedIn = await sessionCheck();
      console.log("isAuthenticated : ", isLoggedIn);
      console.log("pathname : ", router.pathname);
      if (isLoggedIn) {
        if (router.pathname == "/login") {
          router.push("/");
        }
      } else {
        if (router.pathname != "/login") {
          router.push("/login");
        }
      }
      // 로딩 상태를 false로 변경
      setIsLoading(false);
    })();
  }, [router]);

  const isShowBottomNav = () => {
    const exceptPages = [
      "/login",
      "/orders/create",
      "/orders/modify",
      "/orders/detail",
      "/manage/user/list",
    ];
    return exceptPages.includes(router.pathname);
  };

  return (
    <div className="h-full relative">
      {isLoading ? ( // 로딩 중일 때 로딩 이미지를 표시
        <div className="w-screen h-screen fixed bottom-0 left-0 flex items-center justify-center bg-black bg-opacity-0 z-50 md:hidden">
          <img
            src="/cars/loading_1.gif"
            alt="Loading GIF"
            className="w-40 h-40 object-contain"
          />
        </div>
      ) : (
        <>
          {!isLoginPage && (
            <>
              <Navbar className="h-16 pl-40" />
            </>
          )}
          <main className={"h-full " + (!isLoginPage && "lg:ml-24")}>
            <div
              className={
                "h-full " +
                (isLoginPage ? "" : "bg-white lg:bg-mainBgColor pt-14")
              }
            >
              {children}
            </div>
          </main>
        </>
      )}
      <div>
        <div className="hidden lg:block">{!isLoginPage && <SideNav />}</div>
        <div className="lg:hidden">{!isShowBottomNav() && <BottomNav />}</div>
      </div>
    </div>
  );
};

export default Layout;
