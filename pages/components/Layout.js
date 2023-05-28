import { useRouter } from "next/router";
import localRoutes from "../../services/localRoutes";
import Navbar from "./NavBar";

const Layout = ({ children }) => {
  const router = useRouter();
  const currentPage = localRoutes.find((item) => item.path === router.pathname);

  const isLogin = router.pathname === "/login";

  return (
    <div className="h-full">
      {!isLogin && (
        <>
          <header className="bg-white absolute z-1 shadow-md w-full dark:bg-slate-700 dark:shadow-2xl">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-sans mt-16  dark:text-gray-200">
                {currentPage?.name}
              </h1>
            </div>
          </header>
          <Navbar />
        </>
      )}
      <main className={isLogin ? "h-full" : "h-max"}>
        <div
          className={
            "h-full mx-auto max-w-7xl px-5 lg:px-8 " +
            (isLogin
              ? "-mt-24"
              : "bg-white text-gray-900 dark:bg-gray-600 dark:text-slate-50 pt-32")
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
