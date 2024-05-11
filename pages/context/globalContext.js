// context/GlobalContext.js

import { createContext, useContext, useState } from "react";

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
  const [globalVariable, setGlobalVariable] = useState({});

  const updateGlobalVariable = (newValue) => {
    setGlobalVariable(newValue);
  };

  return (
    <GlobalContext.Provider value={{ globalVariable, updateGlobalVariable }}>
      {children}
    </GlobalContext.Provider>
  );
};
