import { useForm } from "react-hook-form";
import Seo from "../components/Seo";
import { useEffect, useState } from "react";
import { requestServer } from "../../services/apiService";
import apiPaths from "../../services/apiRoutes";
import AddressForm from "../components/forms/AddressForm";
import DateInput from "../components/forms/DateInput";
import ComboBox from "../components/forms/ComboBox";
import { cargoTestData } from "./testData";

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

    loadTestData();
  }, []);

  const loadTestData = () => {
    Object.keys(cargoTestData).forEach((key) => {
      setValue(key, cargoTestData[key]);
    });
  };

  const getTruckTypeList = async () => {
    const cargoTon = getValues("cargoTon");
    const { code, data } = await requestServer(apiPaths.apiOrderTruckType, {
      cargoTon,
    });
    if (code === 1) {
      setTruckTypeList(data);
    }
  };

  const createCargoOrder = async () => {
    const cargoOrder = getValues();
    const result = await requestServer(
      apiPaths.custReqAddCargoOrder,
      cargoOrder
    );
    console.log(result);
  };

  const onValid = () => {
    createCargoOrder();
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
          <span>차량톤수(t)</span>
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
        <div>
          <span>적재중량(t)</span>
          <input
            type="number"
            step="any"
            placeholder="차량톤수의 110%까지"
            {...register("frgton", {
              onChange: (e) => {
                const cargoTon = Number(getValues("cargoTon"));
                const frgTon = Number(e.target.value);
                const maxTon = cargoTon * 1.1;
                if (frgTon > maxTon) {
                  e.target.value = maxTon.toString();
                }
                if (frgTon < 0) {
                  e.target.value = "0";
                }
                console.log(maxTon);
              },
            })}
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
        <div>
          <span>하차지 전화번호</span>
          <input
            {...register("endAreaPhone", {
              required: "하차지 전화번호를 입력해주세요.",
            })}
            type="tel"
            maxLength={11}
            placeholder={"'-'없이 입력하세요"}
          />
          {errors.endAreaPhone?.message}
        </div>
        <div>
          <span>의뢰자 구분</span>
          <select {...register("firstType")}>
            <option value={"01"}>일반화주</option>
            <option value={"02"}>주선/운송사</option>
          </select>
          {errors.firstType?.message}
        </div>
        <div>
          <span>원화주 명</span>
          <input
            {...register("firstShipperNm", {
              required: "원화주 명을 입력해주세요.",
            })}
            type="text"
          />
          {errors.firstShipperNm?.message}
        </div>
        <div>
          <span>원화주 전화번호</span>
          <input
            {...register("firstShipperInfo", {
              required: "원화주 전화번호를 입력해주세요.",
            })}
            type="tel"
            maxLength={11}
            placeholder={"'-'없이 입력하세요"}
          />
          {errors.firstShipperInfo?.message}
        </div>
        <div>
          <span>원화주 사업자번호</span>
          <input
            {...register("firstShipperBizNo", {
              required:
                getValues("firstType") === "02"
                  ? "원화주 사업자번호을 입력해주세요."
                  : false,
            })}
            type="text"
            maxLength={10}
            placeholder="의뢰자 주선/운송사인 경우 필수"
          />
          {errors.firstShipperBizNo?.message}
        </div>
        <div>
          <span>운송료 지불구분</span>
          <ComboBox
            register={register}
            list={["Y"]}
            title={"전자세금계산서 발행여부"}
            name={"taxbillType"}
          />
          {errors.taxbillType?.message}
        </div>
        <div>
          <DateInput
            register={register}
            setValue={setValue}
            name={"payPlanYmd"}
            title={"운송료지급예정일"}
          />
        </div>
        <p></p>
        <input type="submit" />
      </form>
    </div>
  );
}
