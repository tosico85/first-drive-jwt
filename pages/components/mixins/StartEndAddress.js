import { useContext } from "react";
import { useState } from "react";
import AuthContext from "../../context/authContext";
import { useEffect } from "react";
import apiPaths from "../../../services/apiRoutes";
import { isEmpty } from "../../../utils/StringUtils";

const StartEndAddress = ({ paramValue, setValue }) => {
  const [sidoList, setSidoList] = useState([]);
  const [gugunList, setGugunList] = useState([]);
  const [sido, setSido] = useState(paramValue?.wide || "");
  const [gugun, setGugun] = useState(paramValue?.sgg || "");

  const { requestServer } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      if (sidoList.length == 0) {
        await getSidoList();
        if (!isEmpty(sido)) {
          await getGugunList(sido);
        }
      }
    })();
  }, []);

  useEffect(() => {
    setValue({ sido, gugun });
  }, [sido, gugun]);

  // 시/도 리스트 조회
  const getSidoList = async () => {
    const { code, data } = await requestServer(apiPaths.apiOrderAddr, {});

    if (code === 1) {
      setSidoList(data);
    }
  };

  // 시/도 선택 이벤트
  const handleSelectSido = async (e) => {
    //console.log(">> handleSelectSido()");
    const {
      target: { value: selectdSido },
    } = e;

    //returnValues(selectdSido, "", "");
    if (selectdSido != sido) {
      setGugun("");
      setSido(selectdSido);
      await getGugunList(selectdSido);
    }
  };

  // 구/군 리스트 조회
  const getGugunList = async (selectdSido) => {
    setGugunList([]);

    if (selectdSido !== "") {
      const { code, data } = await requestServer(apiPaths.apiOrderAddr, {
        sido: selectdSido,
      });
      if (code === 1) {
        setGugunList(data);
      }
    }
  };

  // 구/군 선택 이벤트
  const handleSelectGugun = async (e) => {
    const {
      target: { value: selectedGugun },
    } = e;

    //returnValues(sido, selectedGugun, "");
    setGugun(selectedGugun);
  };

  return (
    <div className="flex items-center gap-x-3">
      <div>
        <select
          value={sido}
          onChange={handleSelectSido}
          className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
        >
          <option value="">주소(시/도)</option>
          {sidoList.map(({ nm }, i) => (
            <option key={i} value={nm}>
              {nm}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          value={gugun}
          onChange={handleSelectGugun}
          className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
        >
          <option value="">주소(구/군)</option>
          {gugunList.map(({ nm }, i) => (
            <option key={i} value={nm}>
              {nm}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default StartEndAddress;
