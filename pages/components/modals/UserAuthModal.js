import { useForm } from "react-hook-form";
import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";
import Label from "../custom/Label";

export default function UserAuthModal({ selectedUser, onCancel, onComplete }) {
  const { requestServer } = useContext(AuthContext);
  const [groupList, setGroupList] = useState([]);

  //권한목록
  const LOAD_TYPE_LIST = [
    { value: "USER", name: "사용자(화주)" },
    { value: "ADMIN", name: "관리자" },
  ];

  const methods = useForm({ mode: "onSubmit" });
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = methods;

  // 권한코드 / 그룹목록 조회
  useEffect(() => {
    if (selectedUser.auth_code == "APPLY") {
      selectedUser.auth_code = "USER";
    }
    setValue("auth_code", selectedUser.auth_code);
    getGroupList();
  }, [selectedUser]);

  // 그룹목록 조회
  const getGroupList = async () => {
    const url = apiPaths.adminGetGroup;
    const params = {};

    const result = await requestServer(url, params);
    if (result?.length > 0) {
      result = result.map((item) => ({
        value: item.group_code,
        name: item.name,
      }));
      setGroupList(() => result);
      setValue("group_code", selectedUser.group_code);
    }
    //console.log("Group list >> ", groupList);
  };

  // 사용자정보 수정
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
        alert("사용자정보가 수정되었습니다.");
        onComplete();
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
    <form
      className="flex flex-col justify-between h-full"
      onSubmit={handleSubmit(onValid, oninvalid)}
    >
      <div>
        <h2 className="text-lg font-semibold leading-7">사용자 정보 변경</h2>
        <div className="pt-5">
          <div className="grid grid-cols-1 gap-y-3">
            <div>
              <div className="flex gap-x-2">
                <Label title={"권한"} required={true} />
                <select
                  {...register("auth_code", {
                    required: `권한을 입력해주세요`,
                  })}
                  className="block w-full lg:w-3/4 rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 lg:text-sm"
                >
                  {LOAD_TYPE_LIST.map((item, i) => (
                    <option key={i} value={item.value}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-red-500 mx-auto font-bold text-center">
                {errors.auth_code?.message}
              </div>
            </div>
            <div className="flex gap-x-2">
              <Label title={"그룹"} />
              <select
                {...register("group_code")}
                className="block w-full lg:w-3/4 rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 lg:text-sm"
              >
                <option value={""}>그룹 선택</option>
                {groupList.map((item, i) => (
                  <option key={i} value={item.value}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-3 grid grid-cols-2 gap-x-3">
        <button
          type="button"
          className="rounded-md bg-normalGray px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          onClick={onCancel}
        >
          취소
        </button>
        <button
          type="submit"
          className="rounded-md bg-mainBlue px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
        >
          권한 수정
        </button>
      </div>
    </form>
  );
}
