import { createContext, useState } from "react";
import apiPaths from "../services/apiRoutes";
import { requestServer } from "../services/apiService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const sessionCheck = async () => {
    const { resultCd } = await requestServer(apiPaths.userSessionCheck, {});

    if (resultCd === "00") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  };

  const login = async (email, password) => {
    // 서버에 로그인 요청을 보내고, 응답에 따라 상태를 업데이트합니다.
    const params = {
      email,
      password,
    };

    const { resultCd } = await requestServer(apiPaths.userLogin, params);
    if (resultCd === "00") {
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    const { resultCd } = await requestServer(apiPaths.userLogout, {});
    if (resultCd === "00") {
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, sessionCheck }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
