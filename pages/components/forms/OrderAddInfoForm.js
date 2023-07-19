import { useForm } from "react-hook-form";
import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";

export default function OrderAddInfoForm({ cargo_seq, onCancel, onComplete }) {
  const { requestServer } = useContext(AuthContext);

  const methods = useForm({ mode: "onSubmit" });
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = methods;

  const updateCargoOrder = async () => {
    if (cargo_seq) {
      const cargoOrder = { cargo_seq, ...getValues() };

      console.log(cargoOrder);
      const { result, resultCd } = await requestServer(
        apiPaths.adminModCargoOrder,
        cargoOrder
      );

      if (resultCd === "00") {
        alert("화물 오더가 수정되었습니다.");
        const [fare, fareView] = getValues(["fare", "fareView"]);
        onComplete({ fare, fareView });
      } else {
        alert(result);
      }
    } else {
      alert("오류 발생~!!");
    }
  };

  const onValid = () => {
    updateCargoOrder();
  };

  const oninvalid = () => {
    console.log(errors);
  };

  return (
    <form onSubmit={handleSubmit(onValid, oninvalid)}>
      <div className="border-b border-gray-900/10 pb-8">
        <h2 className="text-lg font-semibold leading-7">운송료 정보</h2>
        <p className="mt-1 text-sm leading-6 mb-5 text-gray-600">
          운송료를 입력해주세요.
        </p>
        <div>
          <div className="grid grid-cols-1">
            <div>
              <label className="block text-sm font-medium leading-6">
                운송료
              </label>
              <input
                {...register("fare", {
                  required: "운송료를 입력해주세요.",
                })}
                type="number"
                maxLength={10}
                placeholder={"숫자만 입력하세요"}
                className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 lg:text-sm lg:leading-6"
              />
              <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                {errors.fare?.message}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6">
                운송료(화주노출용)
              </label>
              <input
                {...register("fareView", {
                  required: "운송료를 입력해주세요.",
                })}
                type="number"
                maxLength={10}
                placeholder={"숫자만 입력하세요"}
                className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 lg:text-sm lg:leading-6"
              />
              <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                {errors.fareView?.message}
              </div>
            </div>
            {/* <div className="hidden">
              <label className="block text-sm font-medium leading-6">
                수수료
              </label>
              <input
                {...register("fee")}
                type="number"
                maxLength={10}
                placeholder={"숫자만 입력하세요"}
                className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 lg:text-sm lg:leading-6"
              />
              <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                {errors.fee?.message}
              </div>
            </div> */}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold leading-6"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-mainColor3 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-mainColor2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor3"
        >
          화물 수정
        </button>
      </div>
    </form>
  );
}
