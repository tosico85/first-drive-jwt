import { useEffect, useState } from "react";
import { requestServer } from "../../../services/apiService";
import apiPaths from "../../../services/apiRoutes";
import ComboBox from "./ComboBox";

const AddressForm = ({ clsf, register, getValues, errors }) => {
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
    const sido = getValues(`${clsf}Wide`);
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
    const sido = getValues(`${clsf}Wide`);
    const gugun = getValues(`${clsf}Sgg`);
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
          name={`${clsf}Wide`}
        />
        {errors[`${clsf}Wide`]?.message}
      </div>
      <div>
        <ComboBox
          register={register}
          onChange={getDongList}
          list={gugunList.map(({ nm }) => nm)}
          title={"주소(구/군)"}
          name={`${clsf}Sgg`}
        />
        {errors[`${clsf}Sgg`]?.message}
      </div>
      <div>
        <ComboBox
          register={register}
          list={dongList.map(({ nm }) => nm)}
          title={"주소(읍/면/동)"}
          name={`${clsf}Dong`}
        />
        {errors[`${clsf}Dong`]?.message}
      </div>
      <div>
        <input
          {...register(`${clsf}Detail`, {
            required: "상세주소를 입력해주세요.",
          })}
          type="text"
        />
        {errors[`${clsf}Detail`]?.message}
      </div>
    </>
  );
};

export default AddressForm;
