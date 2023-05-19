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
      }
    })();
  }, []);

  const getGugunList = async (e) => {
    const {
      target: { value: selectdSido },
    } = e;

    setSido(() => selectdSido);
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

  const getDongList = async (e) => {
    const {
      target: { value: selectedGugun },
    } = e;
    setGugun(() => selectedGugun);
    setDongList([]);

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

    const returnValue = {};
    returnValue[`${clsf}Wide`] = sido;
    returnValue[`${clsf}Sgg`] = gugun;
    returnValue[`${clsf}Dong`] = seledtedDong;

    addressChange(returnValue);
  };

  return (
    <>
      <div>
        <select onChange={getGugunList}>
          <option value="">주소(시/도)</option>
          {sidoList.map(({ nm }, i) => (
            <option key={i} value={nm}>
              {nm}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select onChange={getDongList}>
          <option value="">주소(구/군)</option>
          {gugunList.map(({ nm }, i) => (
            <option key={i} value={nm}>
              {nm}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select onChange={handleInputAddress}>
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

/* export async function getStaticProps(context) {
  return {
    props: context,
  };
} */

export default AddressForm;
