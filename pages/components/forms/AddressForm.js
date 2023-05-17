import { useEffect, useState } from "react";
import { requestServer } from "../../../services/apiService";
import apiPaths from "../../../services/apiRoutes";
import ComboBox from "./ComboBox";

const AddressForm = ({ clsf, register, getValues, errors, setAddress }) => {
  const [sidoList, setSidoList] = useState([]);
  const [gugunList, setGugunList] = useState([]);
  const [dongList, setDongList] = useState([]);

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

  const getGugunList = async () => {
    const sido = getValues(`${clsf}AddressSido`);
    console.log(sido);

    if (sido === "") {
      setGugunList([]);
    } else {
      const { code, data: gugunList } = await requestServer(
        apiPaths.apiOrderAddr,
        { sido }
      );
      if (code === 1) {
        setGugunList(gugunList);
      }
    }
  };

  const getDongList = async () => {
    const sido = getValues(`${clsf}AddressSido`);
    const gugun = getValues(`${clsf}AddressGugun`);
    console.log(sido, gugun);

    if (gugun === "") {
      setDongList([]);
    } else {
      const { code, data: dongList } = await requestServer(
        apiPaths.apiOrderAddr,
        { sido, gugun }
      );
      if (code === 1) {
        setDongList(dongList);
      }
    }
  };

  return (
    <>
      <div>
        <ComboBox
          register={register}
          onChange={getGugunList}
          list={sidoList.map(({ nm }) => nm)}
          title={"주소(시/도)"}
          name={`${clsf}AddressSido`}
        />
        {errors[`${clsf}AddressSido`]?.message}
      </div>
      <div>
        <ComboBox
          register={register}
          onChange={getDongList}
          list={gugunList.map(({ nm }) => nm)}
          title={"주소(구/군)"}
          name={`${clsf}AddressGugun`}
        />
        {errors[`${clsf}AddressGugun`]?.message}
      </div>
      <div>
        <ComboBox
          register={register}
          list={dongList.map(({ nm }) => nm)}
          title={"주소(읍/면/동)"}
          name={`${clsf}AddressDong`}
        />
        {errors[`${clsf}AddressDong`]?.message}
      </div>
      <div>
        <input
          {...register(`${clsf}AddressDetail`, {
            required: "상세주소를 입력해주세요.",
          })}
          type="text"
        />
        {errors[`${clsf}AddressDetail`]?.message}
      </div>
    </>
  );
};

export default AddressForm;
