import { useRouter } from "next/router";
import localRoutes from "../../services/localRoutes";
import Navbar from "./NavBar";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";
import AuthContext from "../context/authContext";
import { useContext, useEffect, useState } from "react";

const Layout = ({ children }) => {
  const router = useRouter();
  //const [currentPage, setCurrentPage] = useState(router.pathname);
  const { sessionCheck, userInfo } = useContext(AuthContext);
  //const currentPage = localRoutes.find((item) => item.path === router.pathname);
  const isLoginPage = router.pathname === "/login";

  useEffect(() => {
    (async () => {
      const isLoggedIn = await sessionCheck();
      console.log("isAuthenticated : ", isLoggedIn);
      console.log("pathname : ", router.pathname);
      //alert(isLoggedIn);
      if (isLoggedIn) {
        if (router.pathname == "/login") {
          router.push("/");
        }
      } else {
        if (router.pathname != "/login") {
          router.push("/login");
        }
      }
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
      <div className="h-full relative">
        {!isLoginPage && (
          <>
            {/* <header
              className={
                "bg-white absolute shadow-md w-full" +
                (router.pathname == "/orders/list" ? " hidden lg:block" : "")
              }
            >
              <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 lg:px-8">
                <h1 className="text-2xl font-bold tracking-tight text-mainColor1 font-sans mt-16">
                  {currentPage?.name}
                </h1>
              </div>
            </header> */}
            <Navbar className="h-16 pl-4" />
          </>
        )}
        <main className={"h-full " + (!isLoginPage && "lg:ml-24")}>
          <div
            className={
              "h-full " +
              (isLoginPage ? "" : "bg-white lg:bg-mainBgColor pt-14")
            }
          >
            {/* <div className="h-full mx-auto max-w-7xl px-5 lg:px-8 pt-36"> */}
            {children}
          </div>
        </main>
      </div>
      <div>
        <div className="hidden lg:block">{!isLoginPage && <SideNav />}</div>
        <div className="lg:hidden">{!isShowBottomNav() && <BottomNav />}</div>
      </div>
    </div>
  );
};

export default Layout;
