import { useRouter } from "next/router";
import localRoutes from "../../services/localRoutes";
import Navbar from "./NavBar";
import BottomNav from "./BottomNav";

const Layout = ({ children }) => {
  const router = useRouter();
  const currentPage = localRoutes.find((item) => item.path === router.pathname);
  const isLogin = router.pathname === "/login";

  const isShowBottomNav = () => {
    const exceptPages = [
      "/login",
      "/orders/create",
      "/orders/modify",
      "/orders/detail",
    ];
    return exceptPages.includes(router.pathname);
  };

  return (
    <div className="h-full relative">
      <div className="h-full relative">
        {!isLogin && (
          <>
            <header
              className={
                "bg-white absolute shadow-md w-full" +
                (router.pathname == "/orders/list" ? " hidden" : "")
              }
            >
              <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold tracking-tight text-richBlack font-sans mt-16">
                  {currentPage?.name}
                </h1>
              </div>
            </header>
            <Navbar />
          </>
        )}
        <main className={" " + (isLogin ? "h-full" : "h-max")}>
          <div
            className={
              "h-full mx-auto max-w-7xl lg:px-8 " +
              (isLogin ? "" : "bg-white text-richBlack pt-32")
            }
          >
            {/* <div className="h-full mx-auto max-w-7xl px-5 lg:px-8 pt-36"> */}
            {children}
          </div>
        </main>
      </div>
      {!isShowBottomNav() && <BottomNav />}
    </div>
  );
};

export default Layout;
