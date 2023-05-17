import { useForm } from "react-hook-form";
import Seo from "../components/Seo";
import { useEffect, useState } from "react";
import { requestServer } from "../../services/apiService";
import apiPaths from "../../services/apiRoutes";
import AddressForm from "../components/forms/AddressForm";
import DateInput from "../components/forms/DateInput";
import ComboBox from "../components/forms/ComboBox";

export default function OrderCreate() {
  const [cargoTonList, setCargoTonList] = useState([]);
  const [truckTypeList, setTruckTypeList] = useState([]);
  const LOAD_TYPE_LIST = [
    "지게차",
    "수작업",
    "크레인",
    "호이스트",
    "컨베이어",
    "기타",
  ];
  const PAY_TYPE_LIST = ["선착불", "인수증", "카드"];

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    getValues,
    setValue,
    reset,
    resetField,
    formState: { errors },
  } = useForm({ mode: "onSubmit" });

  useEffect(() => {
    (async () => {
      const { code, data } = await requestServer(apiPaths.apiOrderCargoTon, {});
      if (code === 1) {
        setCargoTonList(data);
      }
    })();
  }, []);

  const getTruckTypeList = async () => {
    const cargoTon = getValues("cargoTon");
    const { code, data } = await requestServer(apiPaths.apiOrderTruckType, {
      cargoTon,
    });
    if (code === 1) {
      setTruckTypeList(data);
    }
  };

  const onValid = () => {
    //console.log(startAddress);
    console.log(
      getValues([
        "startAddressSido",
        "startAddressGugun",
        "startAddressDong",
        "startAddressDetail",
        "startPlanDt",
      ])
    );
  };

  const oninvalid = () => {
    console.log(getValues("startPlanDt"));
    console.log(errors);
  };

  return (
    <div>
      <Seo title="화물 등록" />
      <h1>화물 등록</h1>

      <form onSubmit={handleSubmit(onValid, oninvalid)}>
        <p>상차지 주소</p>
        <AddressForm
          key={1}
          clsf={"start"}
          register={register}
          getValues={getValues}
          errors={errors}
        />
        <p>하차지 주소</p>
        <AddressForm
          key={2}
          clsf={"end"}
          register={register}
          getValues={getValues}
          errors={errors}
        />
        <p></p>
        <div>
          <span>혼적여부</span>
          <ComboBox
            register={register}
            list={["Y", "N"]}
            title={"혼적여부"}
            name={"multiCargoGub"}
          />
        </div>
        <div>
          <span>긴급여부</span>
          <ComboBox
            register={register}
            list={["Y", "N"]}
            title={"긴급여부"}
            name={"urgent"}
          />
        </div>
        <div>
          <span>왕복여부</span>
          <ComboBox
            register={register}
            list={["Y", "N"]}
            title={"왕복여부"}
            name={"shuttleCargoInfo"}
          />
        </div>
        <p></p>
        <div>
          <span>차량톤수</span>
          <ComboBox
            register={register}
            onChange={getTruckTypeList}
            list={cargoTonList.map(({ nm }) => nm)}
            title={"차량톤수"}
            name={"cargoTon"}
          />
        </div>
        <div>
          <span>차량종류</span>
          <ComboBox
            register={register}
            list={truckTypeList.map(({ nm }) => nm)}
            title={"차량종류"}
            name={"truckType"}
          />
        </div>
        <p></p>
        <div>
          <DateInput
            register={register}
            setValue={setValue}
            name={"startPlanDt"}
            title={"상차일자"}
          />
        </div>
        <div>
          <DateInput
            register={register}
            setValue={setValue}
            name={"endPlanDt"}
            title={"하차일자"}
          />
        </div>
        <p></p>
        <div>
          <span>상차방법</span>
          <ComboBox
            register={register}
            list={LOAD_TYPE_LIST}
            title={"상차방법"}
            name={"startLoad"}
          />
          {errors.startLoad?.message}
        </div>
        <div>
          <span>하차방법</span>
          <ComboBox
            register={register}
            list={LOAD_TYPE_LIST}
            title={"하차방법"}
            name={"endLoad"}
          />
          {errors.endLoad?.message}
        </div>
        <p></p>
        <div>
          <span>화물상세내용</span>
          <input
            {...register("cargoDsc", {
              required: "화물상세내용을 입력해주세요.",
            })}
            type="text"
          />
          {errors.cargoDsc?.message}
        </div>
        <div>
          <span>운송료 지불구분</span>
          <ComboBox
            register={register}
            list={PAY_TYPE_LIST}
            title={"운송료 지불구분"}
            name={"farePaytype"}
          />
          {errors.farePaytype?.message}
        </div>

        {/* 
        endAreaPhone	하차지 전화번호
        firstType	의뢰자구분("01","02"중 선택)*01:일반화주,02:주선/운송사
        firstShipperNm	원화주명
        firstShipperInfo	원화주 전화번호
        firstShipperBizNo	원화주 사업자번호(firstType이 "02"인 경우 필수)
        taxbillType	전자세금계산서 발행여부("Y")
        payPlanYmd	운송료지급예정일("YYYYMMDD")
        ddID	담당자 아이디 */}

        <input type="submit" />
      </form>
    </div>
  );
}
