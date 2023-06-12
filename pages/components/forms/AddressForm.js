import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";

const AddressForm = ({ addressChange, addressValue, clsf }) => {
  const { requestServer } = useContext(AuthContext);

  const [sidoList, setSidoList] = useState([]);
  const [gugunList, setGugunList] = useState([]);
  const [dongList, setDongList] = useState([]);

  const [sido, setSido] = useState("");
  const [gugun, setGugun] = useState("");
  const [dong, setDong] = useState("");

  useEffect(() => {
    (async () => {
      //console.log(">> AddressForm useEffect()");
      if (sidoList.length == 0) {
        const { code, data: sidoList } = await requestServer(
          apiPaths.apiOrderAddr,
          {}
        );

        if (code === 1) {
          setSidoList(sidoList);

          // 전달받은 주소 set
          //console.log("addressValue", addressValue);
        }
      }
      if (addressValue[`${clsf}Wide`]) {
        //console.log(">> Call setParamDatas()");
        await setParamDatas();
      }
    })();
  }, [addressValue]);

  const setParamDatas = async () => {
    //console.log(">> setParamDatas()");
    const wide = addressValue[`${clsf}Wide`];
    const sgg = addressValue[`${clsf}Sgg`];
    const dng = addressValue[`${clsf}Dong`];

    setSido(() => wide);
    await getGugunList(wide);

    setGugun(() => sgg);
    await getDongList(wide, sgg);

    setDong(() => dng);
    returnValues(wide, sgg, dng);
  };

  const handleSelectSido = async (e) => {
    //console.log(">> handleSelectSido()");
    const {
      target: { value: selectdSido },
    } = e;

    returnValues(selectdSido, "", "");
    setSido(() => selectdSido);
    await getGugunList(selectdSido);
  };

  const getGugunList = async (selectdSido) => {
    setGugunList([]);
    setDongList([]);

    if (selectdSido !== "") {
      const { code, data: gugunList } = await requestServer(
        apiPaths.apiOrderAddr,
        {
          sido: selectdSido,
        }
      );
      if (code === 1) {
        setGugunList(gugunList);
      }
    }
  };

  const handleSelectGugun = async (e) => {
    const {
      target: { value: selectedGugun },
    } = e;

    returnValues(sido, selectedGugun, "");
    setGugun(() => selectedGugun);
    await getDongList(sido, selectedGugun);
  };

  const getDongList = async (sido, selectedGugun) => {
    setDongList([]);
    //console.log(sido);

    if (selectedGugun !== "") {
      const { code, data: dongList } = await requestServer(
        apiPaths.apiOrderAddr,
        {
          sido,
          gugun: selectedGugun,
        }
      );
      if (code === 1) {
        setDongList(dongList);
      }
    }
  };

  const handleInputAddress = (e) => {
    const {
      target: { value: seledtedDong },
    } = e;
    setDong(() => seledtedDong);
    returnValues(sido, gugun, seledtedDong);
  };

  const returnValues = (sSido, sSgg, sDong) => {
    const returnValue = {};
    returnValue[`${clsf}Wide`] = sSido;
    returnValue[`${clsf}Sgg`] = sSgg;
    returnValue[`${clsf}Dong`] = sDong;

    addressChange(returnValue);
  };

  return (
    <div className="grid grid-cols-1 gap-y-4 lg:grid-cols-5 gap-5 dark:text-gray-500">
      <div>
        <select
          value={sido}
          onChange={handleSelectSido}
          className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
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
          className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
        >
          <option value="">주소(구/군)</option>
          {gugunList.map(({ nm }, i) => (
            <option key={i} value={nm}>
              {nm}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          value={dong}
          onChange={handleInputAddress}
          className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
        >
          <option value="">주소(읍/면/동)</option>
          {dongList.map(({ nm }, i) => (
            <option key={i} value={nm}>
              {nm}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AddressForm;
