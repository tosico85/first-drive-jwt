import { useContext } from "react";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";
import Label from "../custom/Label";
import { useInput } from "../../../hooks/useInput";

export default function UserPasswordSetModal({
  selectedUser,
  onCancel,
  onComplete,
}) {
  const { requestServer, userInfo } = useContext(AuthContext);
  const newPassword = useInput("");

  // 사용자정보 수정
  const updateUserPassword = async () => {
    //console.log(selectedUser);
    if (selectedUser.email) {
      const user = { email: selectedUser.email, password: newPassword.value };
      console.log(user);

      //console.log(user);
      const { result, resultCd } = await requestServer(
        userInfo.auth_code == "ADMIN"
          ? apiPaths.adminChangePassword
          : apiPaths.userChangePassword,
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

  return (
    <div>
      <div>
        <h2 className="text-lg font-semibold leading-7">
          새로운 비밀번호 입력
        </h2>
        <div className="pt-5">
          <div className="mb-4 lg:flex lg:gap-x-2">
            <Label title={"비밀번호"} required={true} />
            <input
              {...newPassword}
              type="password"
              placeholder={`변경할 비밀번호 입력`}
              className="w-full rounded-md border-2 px-3 py-2 shadow-md placeholder-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor focus:outline-none"
            />
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
          type="button"
          className="rounded-md bg-mainBlue px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
          onClick={updateUserPassword}
        >
          수정
        </button>
      </div>
    </div>
  );
}
