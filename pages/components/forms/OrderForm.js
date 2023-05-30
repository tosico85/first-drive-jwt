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
  //const [paramData, setParamData] = useState(editData || {});
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
    setValue("cargoTon", editData["cargoTon"] || "");

    if (editData["cargoTon"]) {
      await getTruckTypeList();
      Object.keys(editData).forEach((key) => {
        if (
          [
            "taxbillType",
            "multiCargoGub",
            "urgent",
            "shuttleCargoInfo",
          ].includes(key)
        ) {
          setValue(key, (editData[key] || "") != "");
        } else {
          setValue(key, editData[key]);
        }
      });

      console.log("editData : ", editData);
      console.log("cargoOrder : ", getValues());
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

  const checkboxValueReset = (object) => {
    // 체크박스 control을 위한 처리
    [
      { key: "taxbillType", value: "Y" },
      { key: "multiCargoGub", value: "혼적" },
      { key: "urgent", value: "긴급" },
      { key: "shuttleCargoInfo", value: "왕복" },
    ].forEach((item) => {
      object[item.key] = object[item.key] ? item.value : "";
    });

    return object;
  };

  const createCargoOrder = async () => {
    const cargoOrder = (({ startAddress, endAddress, ...rest }) => rest)(
      getValues()
    );
    cargoOrder = checkboxValueReset(cargoOrder);

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

    cargoOrder = checkboxValueReset(cargoOrder);

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
      <div className="border-b border-gray-900/10 dark:border-gray-900/40 pb-8">
        <h2 className="text-lg font-semibold leading-7">상차지 정보</h2>
        <p className="mt-1 text-sm leading-6 mb-5 text-gray-600 dark:text-gray-300">
          상차지 주소 및 상차방법, 상차일자를 입력해주세요.
        </p>
        <h2 className="mt-10 mb-3 text-base font-semibold leading-7">
          상차지 주소
        </h2>
        <div className="grid grid-cols-1">
          <div className="mb-5">
            <label className="block text-sm font-medium leading-6">
              지역 선택(시/군/구, 동)
            </label>
            <Controller
              control={control}
              name="startAddress"
              rules={{ required: "상차지 주소를 입력해주세요." }}
              render={() => (
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
                    startWide: editData.startWide,
                    startSgg: editData.startSgg,
                    startDong: editData.startDong,
                  }}
                  clsf="start"
                />
              )}
            />
            {errors.startAddress?.message}
          </div>
          <div>
            <label className="block text-sm font-medium leading-6">
              상세주소
            </label>
            <input
              {...register(`startDetail`, {
                required: "상세주소를 입력해주세요.",
              })}
              type="text"
              placeholder="상차지 상세주소"
              className="block sm:w-10/12 w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
            />
            {errors[`startDetail`]?.message}
          </div>
        </div>
        <div>
          <h2 className="mt-10 mb-3 text-base font-semibold leading-7">
            기타사항
          </h2>
          <div className="grid lg:grid-cols-6 grid-cols-1">
            <div>
              <label className="block text-sm font-medium leading-6">
                상차일자
              </label>
              <Controller
                control={control}
                name="startPlanDt"
                rules={{ required: "상차일자를 입력해주세요." }}
                render={({ field: { onChange } }) => (
                  <DateInput
                    onDateChange={onChange}
                    dateValue={getValues("startPlanDt")}
                  />
                )}
              />
            </div>
            <div className="lg:col-span-5">
              <label className="block text-sm font-medium leading-6">
                상차방법
              </label>
              <select
                {...register("startLoad", {
                  required: `상차방법을 입력해주세요`,
                })}
                className="block w-full lg:w-1/4 rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
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
          </div>
        </div>
      </div>

      <div className="border-b border-gray-900/10 dark:border-gray-900/40 py-8">
        <h2 className="text-lg font-semibold leading-7">하차지 정보</h2>
        <p className="mt-1 text-sm leading-6 mb-5 text-gray-600 dark:text-gray-300">
          하차지 주소 및 하차방법, 하차일자, 연락처 정보를 입력해주세요.
        </p>
        <h2 className="mt-10 mb-3 text-base font-semibold leading-7">
          하차지 주소
        </h2>
        <div className="grid grid-cols-1">
          <div className="mb-5">
            <label className="block text-sm font-medium leading-6">
              지역 선택(시/군/구, 동)
            </label>
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
                    endWide: editData.endWide,
                    endSgg: editData.endSgg,
                    endDong: editData.endDong,
                  }}
                  clsf="end"
                />
              )}
            />
            {errors.endAddress?.message}
          </div>
          <div>
            <label className="block text-sm font-medium leading-6">
              상세주소
            </label>
            <input
              {...register(`endDetail`, {
                required: "상세주소를 입력해주세요.",
              })}
              type="text"
              placeholder="하차지 상세주소"
              className="block sm:w-10/12 w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
            />
            {errors[`endDetail`]?.message}
          </div>
        </div>
        <div>
          <h2 className="mt-10 mb-3 text-base font-semibold leading-7">
            기타사항
          </h2>

          <div className="grid lg:grid-cols-5 grid-cols-1 lg:gap-x-10 gap-y-3">
            <div>
              <label className="block text-sm font-medium leading-6">
                하차일자
              </label>
              <Controller
                control={control}
                name="endPlanDt"
                rules={{ required: "하차일자를 입력해주세요." }}
                render={({ field: { onChange } }) => (
                  <DateInput
                    onDateChange={onChange}
                    dateValue={getValues("endPlanDt")}
                  />
                )}
              />
            </div>
            <div className="">
              <label className="block text-sm font-medium leading-6">
                하차방법
              </label>
              <select
                {...register("endLoad", {
                  required: `하차방법을 입력해주세요`,
                })}
                className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
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
            <div className="">
              <label className="block text-sm font-medium leading-6">
                하차지 전화번호
              </label>
              <input
                {...register("endAreaPhone", {
                  required: "하차지 전화번호를 입력해주세요.",
                })}
                type="tel"
                maxLength={11}
                placeholder={"'-'없이 입력하세요"}
                className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
              />
              {errors.endAreaPhone?.message}
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-gray-900/10 dark:border-gray-900/40 py-8">
        <h2 className="text-lg font-semibold leading-7">화물 정보</h2>
        <p className="mt-1 text-sm leading-6 mb-5 text-gray-600 dark:text-gray-300">
          화물 내용과 차량정보를 입력해주세요.
        </p>
        <div className="mt-10">
          <span>화물상세내용</span>
          <input
            {...register("cargoDsc", {
              required: "화물상세내용을 입력해주세요.",
            })}
            type="text"
            className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
          />
          {errors.cargoDsc?.message}
        </div>
        <div className="mt-10">
          <fieldset>
            <legend className="text-base font-semibold leading-6">
              화물 선택사항
            </legend>
            <div className="mt-3 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-4">
              <div className="relative flex gap-x-3">
                <div className="flex h-6 items-center">
                  <input
                    {...register("multiCargoGub")}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                </div>
                <div className="text-sm leading-6">
                  <label htmlFor="comments" className="font-medium">
                    혼적여부
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">
                    (선택)혼적여부를 체크해주세요.
                  </p>
                </div>
              </div>
              <div className="relative flex gap-x-3">
                <div className="flex h-6 items-center">
                  <input
                    {...register("urgent")}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                </div>
                <div className="text-sm leading-6">
                  <label htmlFor="candidates" className="font-medium">
                    긴급여부
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">
                    (선택)긴급여부를 체크해주세요.
                  </p>
                </div>
              </div>
              <div className="relative flex gap-x-3">
                <div className="flex h-6 items-center">
                  <input
                    {...register("shuttleCargoInfo")}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                </div>
                <div className="text-sm leading-6">
                  <label htmlFor="offers" className="font-medium">
                    왕복여부
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">
                    (선택)왕복여부를 체크해주세요.
                  </p>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
        <div className="mt-10">
          <h2 className="text-base font-semibold leading-7 mb-3">차량 정보</h2>
          <div className="grid gap-y-3 lg:grid-cols-4 lg:gap-x-10">
            <div>
              <label className="block text-sm font-medium leading-6">
                차량톤수
              </label>
              <select
                {...register("cargoTon", {
                  required: `차량톤수(t)를 입력해주세요`,
                  onChange: () => getTruckTypeList(),
                })}
                className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
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
              <label className="block text-sm font-medium leading-6">
                차량종류
              </label>
              <select
                {...register("truckType", {
                  required: `차량종류를 입력해주세요`,
                })}
                className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
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
              <label className="block text-sm font-medium leading-6">
                적재중량(t)
              </label>
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
                className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-gray-900/10 dark:border-gray-900/40 py-8 mb-8">
        <h2 className="text-lg font-semibold leading-7">화주 및 의뢰 정보</h2>
        <p className="mt-1 text-sm leading-6 mb-10 text-gray-600 dark:text-gray-300">
          원화주 정보와 운송료 관련 정보를 입력하세요
        </p>
        <div>
          <h2 className="text-base font-semibold leading-7 mb-3">의뢰 정보</h2>
          <div className="grid gap-y-3 lg:grid-cols-4 lg:gap-x-10">
            <div>
              <label className="block text-sm font-medium leading-6">
                의뢰자 구분
              </label>
              <select
                {...register("firstType")}
                className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
              >
                <option value={"01"}>일반화주</option>
                <option value={"02"}>주선/운송사</option>
              </select>
              {errors.firstType?.message}
            </div>
            <div>
              <label className="block text-sm font-medium leading-6">
                운송료 지불구분
              </label>
              <select
                {...register("farePaytype", {
                  required: `운송료 지불구분을 입력해주세요`,
                })}
                className="block w-full rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
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
              <label className="block text-sm font-medium leading-6">
                운송료 지급 예정일
              </label>
              <Controller
                control={control}
                name="payPlanYmd"
                rules={{ required: "운송료지급예정일을 입력해주세요." }}
                render={({ field: { onChange } }) => (
                  <DateInput
                    onDateChange={onChange}
                    dateValue={getValues("payPlanYmd")}
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="mt-10">
          <h2 className="text-base font-semibold leading-7 mb-3">
            원화주 정보
          </h2>
          <div className="grid gap-y-3 lg:grid-cols-4 lg:gap-x-10">
            <div>
              <label className="block text-sm font-medium leading-6">
                원화주 명
              </label>
              <input
                {...register("firstShipperNm", {
                  required: "원화주 명을 입력해주세요.",
                })}
                type="text"
                className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
              />
              {errors.firstShipperNm?.message}
            </div>
            <div>
              <label className="block text-sm font-medium leading-6">
                원화주 전화번호
              </label>
              <input
                {...register("firstShipperInfo", {
                  required: "원화주 전화번호를 입력해주세요.",
                })}
                type="tel"
                maxLength={11}
                placeholder={"'-'없이 입력하세요"}
                className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
              />
              {errors.firstShipperInfo?.message}
            </div>
            <div>
              <label className="block text-sm font-medium leading-6">
                원화주 사업자번호
              </label>
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
                className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-100 dark:text-gray-500"
              />
              {errors.firstShipperBizNo?.message}
            </div>
          </div>
        </div>
        <div className="mt-10">
          <div className="relative flex gap-x-3">
            <div className="flex h-6 items-center">
              <input
                {...register("taxbillType")}
                type="checkbox"
                value={"Y"}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
            </div>
            <div className="text-sm leading-6">
              <label htmlFor="candidates" className="font-medium">
                전자세금계산서 발행여부
              </label>
              <p className="text-gray-500 dark:text-gray-400">
                (선택)전자세금계산서 발행여부를 체크해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm font-semibold leading-6"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {isEdit ? "화물 수정" : "화물 등록"}
        </button>
      </div>
    </form>
  );
}
