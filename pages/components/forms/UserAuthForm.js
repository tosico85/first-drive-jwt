import { useForm } from "react-hook-form";
import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";

export default function UserAuthForm({ selectedUser, onCancel, onComplete }) {
  const { requestServer } = useContext(AuthContext);
  const LOAD_TYPE_LIST = [
    { value: "USER", name: "사용자(화주)" },
    { value: "ADMIN", name: "관리자" },
  ];

  useEffect(() => {
    if (selectedUser.auth_code == "APPLY") {
      selectedUser.auth_code = "USER";
    }
    setValue("auth_code", selectedUser.auth_code);
  }, [selectedUser]);
  {
  }
  const methods = useForm({ mode: "onSubmit" });
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = methods;

  const updateUserAuth = async () => {
    //console.log(selectedUser);
    if (selectedUser.email) {
      const user = { email: selectedUser.email, ...getValues() };

      //console.log(user);
      const { result, resultCd } = await requestServer(
        apiPaths.adminChangeUser,
        user
      );

      if (resultCd === "00") {
        alert("권한이 수정되었습니다.");
        const auth_code = getValues("auth_code");
        onComplete({ auth_code });
      } else {
        alert(result);
      }
    } else {
      alert("오류 발생~!!");
    }
  };

  const onValid = () => {
    updateUserAuth();
  };

  const oninvalid = () => {
    console.log(errors);
  };

  return (
    <form onSubmit={handleSubmit(onValid, oninvalid)}>
      <div className="border-b border-gray-900/10 pb-8">
        <h2 className="text-lg font-semibold leading-7">사용자 권한 변경</h2>
        <p className="mt-1 text-sm leading-6 mb-5 text-gray-600">
          변경할 권한을 선택해주세요.
        </p>
        <div>
          <div className="grid grid-cols-1">
            <div>
              <label className="block text-sm font-medium leading-6">
                권한
              </label>
              <select
                {...register("auth_code", {
                  required: `권한을 입력해주세요`,
                })}
                className="block w-full lg:w-3/4 rounded-md border-0 p-2 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                {LOAD_TYPE_LIST.map((item, i) => (
                  <option key={i} value={item.value}>
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="text-red-500 mx-auto mb-6 font-bold text-center">
                {errors.auth_code?.message}
              </div>
            </div>
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
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          권한 수정
        </button>
      </div>
    </form>
  );
}
