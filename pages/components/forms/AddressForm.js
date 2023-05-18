import { useEffect, useState } from "react";
import { requestServer } from "../../../services/apiService";
import apiPaths from "../../../services/apiRoutes";
import ComboBox from "./ComboBox";
import { FormProvider, useFormContext } from "react-hook-form";

const AddressForm = ({ clsf, errors }) => {
  const [sidoList, setSidoList] = useState([]);
  const [gugunList, setGugunList] = useState([]);
  const [dongList, setDongList] = useState([]);

  const methods = useFormContext();
  const { register, getValues } = methods;

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
        <FormProvider {...methods}>
          <ComboBox
            onChange={getGugunList}
            list={sidoList.map(({ nm }) => nm)}
            title={"주소(시/도)"}
            name={`${clsf}Wide`}
          />
        </FormProvider>
        {errors[`${clsf}Wide`]?.message}
      </div>
      <div>
        <FormProvider {...methods}>
          <ComboBox
            onChange={getDongList}
            list={gugunList.map(({ nm }) => nm)}
            title={"주소(구/군)"}
            name={`${clsf}Sgg`}
          />
        </FormProvider>
        {errors[`${clsf}Sgg`]?.message}
      </div>
      <div>
        <FormProvider {...methods}>
          <ComboBox
            list={dongList.map(({ nm }) => nm)}
            title={"주소(읍/면/동)"}
            name={`${clsf}Dong`}
          />
        </FormProvider>
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

/* export async function getStaticProps(context) {
  return {
    props: context,
  };
} */

export default AddressForm;
