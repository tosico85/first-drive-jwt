import { useEffect, useState } from "react";
import { requestServer } from "../../../services/apiService";
import apiPaths from "../../../services/apiRoutes";

const AddressForm = ({ addressChange, addressValue, clsf }) => {
  const [sidoList, setSidoList] = useState([]);
  const [gugunList, setGugunList] = useState([]);
  const [dongList, setDongList] = useState([]);

  const [sido, setSido] = useState("");
  const [gugun, setGugun] = useState("");
  const [dong, setDong] = useState("");

  useEffect(() => {
    (async () => {
      const { code, data: sidoList } = await requestServer(
        apiPaths.apiOrderAddr,
        {}
      );

      if (code === 1) {
        setSidoList(sidoList);

        // 전달받은 주소 set
        console.log("addressValue", addressValue);
        if (addressValue) {
          await setParamDatas();
        }
      }
    })();
  }, []);

  const setParamDatas = async () => {
    const wide = addressValue[`${clsf}Wide`];
    const sgg = addressValue[`${clsf}Sgg`];
    const dng = addressValue[`${clsf}Dong`];

    setSido(() => wide);
    await getGugunList(wide);

    setGugun(() => sgg);
    await getDongList(wide, sgg);

    setDong(() => dng);
    returnValues(dng);
  };

  const handleSelectSido = async (e) => {
    const {
      target: { value: selectdSido },
    } = e;

    setSido(() => selectdSido);
    await getGugunList(selectdSido);
  };

  const getGugunList = async (selectdSido) => {
    setGugunList([]);
    setDongList([]);

    if (selectdSido !== "") {
      const { code, data: gugunList } = await requestServer(
        apiPaths.apiOrderAddr,
        { sido: selectdSido }
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

    setGugun(() => selectedGugun);
    await getDongList(sido, selectedGugun);
  };

  const getDongList = async (sido, selectedGugun) => {
    setDongList([]);
    console.log(sido);

    if (selectedGugun !== "") {
      const { code, data: dongList } = await requestServer(
        apiPaths.apiOrderAddr,
        { sido, gugun: selectedGugun }
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
    returnValues(seledtedDong);
  };

  const returnValues = (seledtedDong) => {
    const returnValue = {};
    returnValue[`${clsf}Wide`] = sido;
    returnValue[`${clsf}Sgg`] = gugun;
    returnValue[`${clsf}Dong`] = seledtedDong;

    addressChange(returnValue);
  };

  return (
    <>
      <div>
        <select value={sido} onChange={handleSelectSido}>
          <option value="">주소(시/도)</option>
          {sidoList.map(({ nm }, i) => (
            <option key={i} value={nm}>
              {nm}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select value={gugun} onChange={handleSelectGugun}>
          <option value="">주소(구/군)</option>
          {gugunList.map(({ nm }, i) => (
            <option key={i} value={nm}>
              {nm}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select value={dong} onChange={handleInputAddress}>
          <option value="">주소(읍/면/동)</option>
          {dongList.map(({ nm }, i) => (
            <option key={i} value={nm}>
              {nm}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export default AddressForm;
