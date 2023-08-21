import { useContext } from "react";
import { useInput } from "../../../hooks/useInput";
import apiPaths from "../../../services/apiRoutes";
import { isEmptyObject } from "../../../utils/ObjectUtils";
import { isEmpty } from "../../../utils/StringUtils";
import AuthContext from "../../context/authContext";
import Label from "../custom/Label";

const GroupInputModal = ({ selectedGroup = {}, onCancel, onComplete }) => {
  const { requestServer } = useContext(AuthContext);

  // input map set
  const inputMap = {
    name: useInput(selectedGroup?.name || ""),
    memo: useInput(selectedGroup?.memo || ""),
  };

  const inputNameMap = [
    { varName: "name", korName: "그룹명", required: true },
    { varName: "memo", korName: "설명", required: false },
  ];

  const requestType = isEmptyObject(selectedGroup) ? "I" : "U";

  // Validation check
  const validationCheck = () => {
    let isValidate = true;

    if (isEmpty(inputMap.name.value)) {
      isValidate = false;
    }

    return isValidate;
  };

  //그룹 등록
  const insertGroup = async () => {
    const paramData = { name: inputMap.name.value, memo: inputMap.memo.value };
    const { result, resultCd } = await requestServer(
      apiPaths.adminAddGroup,
      paramData
    );

    if (resultCd == "00") {
      alert("그룹이 등록되었습니다.");
      onComplete();
    } else if (resultCd == "88") {
      if (confirm("이미 등록된 그룹입니다. \n수정하시겠습니까?")) {
        updateGroup();
      }
    } else {
      alert("그룹 등록에 실패하였습니다.");
    }
  };

  // 그룹정보 update
  const updateGroup = async () => {
    const paramData = {
      group_code: selectedGroup.group_code,
      name: inputMap.name.value,
      memo: inputMap.memo.value,
    };
    const { result, resultCd } = await requestServer(
      apiPaths.adminModGroup,
      paramData
    );

    if (resultCd == "00") {
      alert("그룹이 수정되었습니다.");
      onComplete();
    } else {
      alert("그룹 수정에 실패하였습니다.");
    }
  };

  //등록/수정
  const handleSelect = async () => {
    if (validationCheck()) {
      // selectedGroup가 비어있다면 등록 아닌 경우 수정
      if (requestType == "U") {
        await updateGroup();
      } else {
        await insertGroup();
      }
    }
  };

  return (
    <div className="flex flex-col gap-y-3 justify-between h-full">
      <div>
        <p className="text-center font-bold">
          그룹정보 {requestType == "I" ? "입력" : "수정"}
        </p>
        <div className="flex flex-col gap-y-3 mt-5">
          <div className="flex flex-col gap-y-3">
            {inputNameMap.map((group) => (
              <div className="flex items-center gap-x-3" key={group.varName}>
                <Label title={group.korName} required={group.required} />
                <input
                  {...inputMap[group.varName]}
                  placeholder={`${group.korName} 그룹 입력`}
                  type="text"
                  className="w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                />
              </div>
            ))}
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
          onClick={handleSelect}
        >
          {requestType == "I" ? "등록" : "수정"}
        </button>
      </div>
    </div>
  );
};

export default GroupInputModal;
