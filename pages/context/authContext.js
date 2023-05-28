import { useRouter } from "next/router";
import { createContext, useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import { callServer } from "../../services/apiService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState({});
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
    console.log("isAuthenticated : ", isAuthenticated);
    console.log("pathname : ", router.pathname);
    const result = await requestServer(apiPaths.userSessionCheck, {});

    if (result.resultCd === "00" || result.resultCd === "01") {
      setIsAuthenticated(true);
      setUserInfo(result.userInfo);
    } else {
      setIsAuthenticated(false);
    }

    return result.resultCd == "00";
  };

  const requestServer = async (path, params) => {
    const result = await callServer(path, params);

    if (result.resultCd === "LN") {
      //Login Need
      setIsAuthenticated(false);
      router.push("/");
    }

    return result;
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
      setUserInfo(result.userInfo);
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
      value={{
        isAuthenticated,
        userInfo,
        join,
        login,
        logout,
        requestServer,
        sessionCheck,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
