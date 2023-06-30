import { useRouter } from "next/router";
import { createContext, useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import { callServer } from "../../services/apiService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  //const [jwtToken, setJwtToken] = useState("");
  const router = useRouter();

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
        router.push("/login");
      }
    })();
  }, []);

  // 로컬스토리지에 jwtToken에서 가져오기
  const tokenLoadFromLocal = () => {
    return localStorage.getItem("jwtToken") || "";
  };

  const sessionCheck = async () => {
    console.log("isAuthenticated : ", isAuthenticated);
    console.log("pathname : ", router.pathname);
    const jwtToken = tokenLoadFromLocal();

    if (jwtToken) {
      const result = await requestServer(apiPaths.userSessionCheck, {});

      if (result.resultCd === "00" || result.resultCd === "01") {
        setIsAuthenticated(true);
        setUserInfo(result.userInfo);
      } else {
        setIsAuthenticated(false);
      }

      //alert(JSON.stringify(result));
      return result.resultCd == "00" || result.resultCd == "01";
    } else {
      setIsAuthenticated(false);
      return false;
    }
  };

  const requestServer = async (path, params) => {
    const jwtToken = tokenLoadFromLocal();
    const result = await callServer(path, params, jwtToken);

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
    if (result.resultCd === "00" || result.resultCd === "01") {
      setIsAuthenticated(true);
      setUserInfo(result.userInfo);

      //setJwtToken(result.jwtToken);
      localStorage.setItem("jwtToken", result.jwtToken);

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
    localStorage.setItem("jwtToken", "");
    //setJwtToken("");
    setIsAuthenticated(false);
    router.push("/login");
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
