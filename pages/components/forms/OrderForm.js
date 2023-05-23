import { Controller, useForm } from "react-hook-form";
import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";
import AddressForm from "./AddressForm";
import DateInput from "../custom/DateInput";
import { useRouter } from "next/router";
import { format } from "date-fns";
import AuthContext from "../../context/authContext";

export default function OrderForm({ isEdit = false, editData = {} }) {
  const router = useRouter();
  const { requestServer } = useContext(AuthContext);
  const [paramData, setParamData] = useState(editData || {});
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

  const methods = useForm({ mode: "onSubmit" });

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    getValues,
    setValue,
    reset,
    resetField,
    control,
    formState: { errors },
  } = methods;

  useEffect(() => {
    (async () => {
      const { code, data } = await requestServer(apiPaths.apiOrderCargoTon, {});
      if (code === 1) {
        setCargoTonList(data);
      }

      const curDt = format(new Date(), "yyyyMMdd");
      setValue("startPlanDt", getValues("startPlanDt") || curDt);
      setValue("endPlanDt", getValues("endPlanDt") || curDt);
      setValue("payPlanYmd", getValues("payPlanYmd") || curDt);

      if (isEdit) {
        await loadParamData();
      }
    })();
  }, []);

  // TEST DATA 로드
  const loadParamData = async () => {
    setValue("cargoTon", paramData["cargoTon"] || "");

    if (paramData["cargoTon"]) {
      await getTruckTypeList();
      Object.keys(paramData).forEach((key) => {
        setValue(key, paramData[key]);
      });
    }
  };

  const getTruckTypeList = async () => {
    const cargoTon = getValues("cargoTon");
    setTruckTypeList([]);

    if (cargoTon !== "") {
      const { code, data } = await requestServer(apiPaths.apiOrderTruckType, {
        cargoTon,
      });
      if (code === 1) {
        setTruckTypeList(data);
      }
    }
  };

  const createCargoOrder = async () => {
    const cargoOrder = (({ startAddress, endAddress, ...rest }) => rest)(
      getValues()
    );
    const { result, resultCd } = await requestServer(
      apiPaths.custReqAddCargoOrder,
      cargoOrder
    );

    if (resultCd === "00") {
      alert("화물 오더가 등록되었습니다.");
      router.push("/");
    } else {
      alert(result);
    }
  };

  const updateCargoOrder = async () => {
    const cargoOrder = (({
      startAddress,
      endAddress,
      change_dtm,
      change_user,
      ...rest
    }) => rest)(getValues());

    console.log(cargoOrder);
    const { result, resultCd } = await requestServer(
      apiPaths.custReqModCargoOrder,
      cargoOrder
    );

    if (resultCd === "00") {
      alert("화물 오더가 수정되었습니다.");
      router.push("/");
    } else {
      alert(result);
    }
  };

  const onValid = () => {
    if (isEdit) {
      updateCargoOrder();
    } else {
      createCargoOrder();
    }
  };

  const oninvalid = () => {
    //console.log(getValues("startPlanDt"));
    //console.log(editData);
    console.log(errors);
  };

  return (
    <form onSubmit={handleSubmit(onValid, oninvalid)}>
      <p>상차지 주소</p>
      <Controller
        control={control}
        name="startAddress"
        rules={{ required: "상차지 주소를 입력해주세요." }}
        render={({ field: { value } }) => (
          <AddressForm
            addressChange={(returnValue) => {
              const { startWide, startSgg, startDong } = returnValue;
              setValue("startWide", startWide);
              setValue("startSgg", startSgg);
              setValue("startDong", startDong);
              setValue("startAddress", returnValue);
              console.log(returnValue);
            }}
            addressValue={{
              startWide: paramData.startWide,
              startSgg: paramData.startSgg,
              startDong: paramData.startDong,
            }}
            clsf="start"
          />
        )}
      />
      {errors.startAddress?.message}
      <div>
        <input
          {...register(`startDetail`, {
            required: "상세주소를 입력해주세요.",
          })}
          type="text"
          placeholder="상차지 상세주소"
        />
        {errors[`startDetail`]?.message}
      </div>
      <p>하차지 주소</p>
      <Controller
        control={control}
        name="endAddress"
        rules={{ required: "하차지 주소를 입력해주세요." }}
        render={({ field: { value } }) => (
          <AddressForm
            addressChange={(returnValue) => {
              const { endWide, endSgg, endDong } = returnValue;
              setValue("endWide", endWide);
              setValue("endSgg", endSgg);
              setValue("endDong", endDong);
              setValue("endAddress", returnValue);
              console.log(returnValue);
            }}
            addressValue={{
              endWide: paramData.endWide,
              endSgg: paramData.endSgg,
              endDong: paramData.endDong,
            }}
            clsf="end"
          />
        )}
      />
      {errors.endAddress?.message}
      <div>
        <input
          {...register(`endDetail`, {
            required: "상세주소를 입력해주세요.",
          })}
          type="text"
          placeholder="하차지 상세주소"
        />
        {errors[`endDetail`]?.message}
      </div>
      <p></p>
      <div>
        <span>혼적여부</span>
        <select {...register("multiCargoGub")}>
          <option value="">혼적여부</option>
          <option value={"혼적"}>혼적</option>
        </select>
      </div>
      <div>
        <span>긴급여부</span>
        <select {...register("urgent")}>
          <option value="">긴급여부</option>
          <option value={"긴급"}>긴급</option>
        </select>
      </div>
      <div>
        <span>왕복여부</span>
        <select {...register("shuttleCargoInfo")}>
          <option value="">왕복여부</option>
          <option value={"왕복"}>왕복</option>
        </select>
      </div>
      <p></p>
      <div>
        <span>차량톤수(t)</span>
        <select
          {...register("cargoTon", {
            required: `차량톤수(t)를 입력해주세요`,
            onChange: () => getTruckTypeList(),
          })}
        >
          <option value="">차량톤수(t)</option>
          {cargoTonList.map(({ nm }, i) => (
            <option key={i} value={nm}>
              {nm}
            </option>
          ))}
        </select>
      </div>
      <div>
        <span>차량종류</span>
        <select
          {...register("truckType", {
            required: `차량종류를 입력해주세요`,
          })}
        >
          <option value="">차량종류</option>
          {truckTypeList &&
            truckTypeList.map(({ nm }, i) => (
              <option key={i} value={nm}>
                {nm}
              </option>
            ))}
        </select>
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
            },
          })}
        />
      </div>
      <p></p>
      <div>
        <Controller
          control={control}
          name="startPlanDt"
          rules={{ required: "상차일자를 입력해주세요." }}
          render={({ field: { onChange } }) => (
            <DateInput
              onDateChange={onChange}
              dateValue={getValues("startPlanDt")}
              title="상차일자"
            />
          )}
        />
      </div>
      <div>
        <Controller
          control={control}
          name="endPlanDt"
          rules={{ required: "하차일자를 입력해주세요." }}
          render={({ field: { onChange } }) => (
            <DateInput
              onDateChange={onChange}
              dateValue={getValues("endPlanDt")}
              title="하차일자"
            />
          )}
        />
      </div>
      <p></p>
      <div>
        <span>상차방법</span>
        <select
          {...register("startLoad", {
            required: `상차방법을 입력해주세요`,
          })}
        >
          <option value="">상차방법</option>
          {LOAD_TYPE_LIST.map((item, i) => (
            <option key={i} value={item}>
              {item}
            </option>
          ))}
        </select>
        {errors.startLoad?.message}
      </div>
      <div>
        <span>하차방법</span>
        <select
          {...register("endLoad", {
            required: `하차방법을 입력해주세요`,
          })}
        >
          <option value="">하차방법</option>
          {LOAD_TYPE_LIST.map((item, i) => (
            <option key={i} value={item}>
              {item}
            </option>
          ))}
        </select>
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
        <select
          {...register("farePaytype", {
            required: `운송료 지불구분을 입력해주세요`,
          })}
        >
          <option value="">운송료 지불구분</option>
          {PAY_TYPE_LIST.map((item, i) => (
            <option key={i} value={item}>
              {item}
            </option>
          ))}
        </select>
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
        <span>전자세금계산서 발행여부</span>
        <select
          {...register("taxbillType", {
            required: `전자세금계산서 발행여부을 입력해주세요`,
          })}
        >
          <option value="">전자세금계산서 발행여부</option>
          <option value="Y">Y</option>
        </select>
        {errors.taxbillType?.message}
      </div>
      <div>
        <Controller
          control={control}
          name="payPlanYmd"
          rules={{ required: "운송료지급예정일을 입력해주세요." }}
          render={({ field: { onChange } }) => (
            <DateInput
              onDateChange={onChange}
              dateValue={getValues("payPlanYmd")}
              title="운송료지급예정일"
            />
          )}
        />
      </div>
      <p></p>
      <input type="submit" value={isEdit ? "화물 수정" : "화물 등록"} />
    </form>
  );
}
