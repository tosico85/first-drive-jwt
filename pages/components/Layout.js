import { useRouter } from "next/router";
import localRoutes from "../../services/localRoutes";
import Navbar from "./NavBar";

const Layout = ({ children }) => {
  const router = useRouter();

  const currentPage = localRoutes.find((item) => item.path === router.pathname);

  console.log(currentPage);

  return (
    <div className="min-h-full">
      {router.pathname !== "/login" && (
        <>
          <Navbar current={currentPage.path} />

          <header className="bg-white shadow">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {currentPage.name}
              </h1>
            </div>
          </header>
        </>
      )}
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
