import { useRouter } from "next/router";
import { createContext, useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import { requestServer } from "../../services/apiService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

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
        router.push("/login");
      }
    })();
  }, []);

  const sessionCheck = async () => {
    const result = await requestServer(apiPaths.userSessionCheck, {});

    if (result.resultCd === "00") {
      setIsAuthenticated(() => true);
    } else {
      setIsAuthenticated(() => false);
    }

    return result.resultCd === "00";
  };

  const login = async (email, password) => {
    // 서버에 로그인 요청을 보내고, 응답에 따라 상태를 업데이트합니다.
    const params = {
      email,
      password,
    };

    const result = await requestServer(apiPaths.userLogin, params);
    if (result.resultCd === "00") {
      setIsAuthenticated(true);
      router.push("/");
    }
    return result;
  };

  const join = async (name, email, password) => {
    // 서버에 로그인 요청을 보내고, 응답에 따라 상태를 업데이트합니다.
    const params = {
      name,
      email,
      password,
    };

    const result = await requestServer(apiPaths.userJoin, params);
    return result;
  };

  const logout = async () => {
    const result = await requestServer(apiPaths.userLogout, {});
    if (result.resultCd === "00") {
      setIsAuthenticated(false);
      router.push("/login");
    }
    return result;
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, join, login, logout, sessionCheck }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export async function getServerSideProps({ children }) {
  return {
    props: { children },
  };
}

export default AuthContext;
