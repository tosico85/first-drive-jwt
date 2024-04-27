import { useContext, useEffect, useState } from "react";
import Label from "../custom/Label";
import AuthContext from "../../context/authContext";
import apiPaths from "../../../services/apiRoutes";
import { useInput } from "../../../hooks/useInput";
import { isEmptyObject } from "../../../utils/ObjectUtils";
import { isEmpty } from "../../../utils/StringUtils";
import { useForm } from "react-hook-form";
import SearchAddressModal from "./SearchAddressModal";
import { Modal } from "@mui/material";

const UserBookmarkModal = ({
  selectedBookmark = {},
  onCancel,
  onComplete,
  selectedGroup,
}) => {
  const { requestServer } = useContext(AuthContext);

  //react-form 관련
  const methods = useForm({ mode: "onSubmit" });
  const {
    reset,
    register,
    handleSubmit,
    getValues,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = methods;

  //base data
  const LOAD_TYPE_LIST = [
    "지게차",
    "수작업",
    "크레인",
    "호이스트",
    "컨베이어",
    "기타",
  ];

  //Modal control
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  //상하차지(수정 요청인 경우 상하차지 세팅)
  const [startAddr, setStartAddr] = useState({
    wide: selectedBookmark?.startWide || "",
    sgg: selectedBookmark?.startSgg || "",
  });
  const [endAddr, setEndAddr] = useState({
    wide: selectedBookmark.endWide || "",
    sgg: selectedBookmark.endSgg || "",
  });

  //등록/수정 요청 구분
  const requestType = isEmptyObject(selectedBookmark) ? "I" : "U";

  const getRequestData = () => {
    return {
      group_code: selectedGroup.value,
      startWide: startAddr.wide,
      startSgg: startAddr.sgg,
      endWide: endAddr.wide,
      endSgg: endAddr.sgg,
    };
  };

  //요금 등록
  const insertBookmark = async () => {
    const paramData = getRequestData();
    const { result, resultCd } = await requestServer(
      apiPaths.userBookmarkAdd,
      paramData
    );

    if (resultCd == "00") {
      alert("요금이 등록되었습니다.");
      onComplete();
    } else if (resultCd == "88") {
      if (
        confirm("이미 요금표에 등록된 상하차 지역입니다.\n수정하시겠습니까?")
      ) {
        updateBookmark();
      }
    } else {
      alert("요금 등록에 실패하였습니다.");
    }
  };

  //요금 수정
  const updateBookmark = async () => {
    const paramData = getRequestData();
    const { result, resultCd } = await requestServer(
      apiPaths.userBookmarkUpdate,
      paramData
    );

    if (resultCd == "00") {
      alert("요금이 수정되었습니다.");
      onComplete();
    } else {
      alert("요금 수정에 실패하였습니다.");
    }
  };

  //등록/수정
  const handleSelect = async () => {
    if (validationCheck()) {
      // selectedBookmark가 비어있다면 등록 아닌 경우 수정
      if (requestType == "U") {
        await updateBookmark();
      } else {
        await insertBookmark();
      }
    }
  };

  /**
   * 주소찾기 버튼 event handle
   * @param {event} e
   * @param {상하차 구분} startEnd
   */
  const handleAddressSearchButton = (startEnd) => {
    //e.preventDefault();
    openAddressModal();
  };

  /********************** Modal Control Start *******************************/

  // Open 주소검색 Modal
  const openAddressModal = () => {
    setIsAddressModalOpen(true);
  };

  // Close 주소검색 Modal
  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
  };

  /**
   * 주소 검색(모달폼) 주소선택 후 callback
   * @param {주소록 선택 리턴값} retVal
   */
  const callbackAddressModal = (retVal) => {
    console.log("retVal >> ", retVal);
    if (retVal) {
      setAddressInput(retVal, modalStartEnd);
    }

    closeAddressModal();
  };

  /**
   * 모달 폼 디자인
   */
  const customModalStyles = {
    content: {
      top: "50%",
      left: "50%",
      height: "70%",
      borderRadius: "10px",
      transform: "translate(-50%, -50%)",
      boxShadow: "0px 0px 10px #e2e2e2",
    },
  };

  const DesktopStyles = {
    // 데스크탑 스타일
    content: {
      ...customModalStyles.content,
      width: "510px",
      minWidth: "fit-content",
    },
  };

  /********************** Modal Control End *******************************/

  return (
    <div>
      <Modal
        isOpen={isAddressModalOpen}
        onRequestClose={closeAddressModal}
        contentLabel="Modal"
        style={DesktopStyles}
      >
        <SearchAddressModal
          onCancel={closeAddressModal}
          onComplete={callbackAddressModal}
        />
      </Modal>

      <div className="flex flex-col gap-y-3">
        <div className="w-full flex flex-col gap-y-3">
          <div className="grid grid-cols-1 gap-y-3">
            <div className="flex gap-x-2">
              <Label title={"주소"} required={true} />
              <div className="w-full flex  gap-x-2">
                <div
                  onClick={() => {
                    //searchAddress("start"); //팝업방식
                    openAddressModal(); //레이어 모달 방식
                  }}
                  className="w-full text-right items-center gap-x-5 relative"
                >
                  <input
                    type="text"
                    placeholder="상차지 주소(시군구동)"
                    readOnly={true}
                    value={getValues([
                      "startWide",
                      "startSgg",
                      "startDong",
                    ]).join(" ")}
                    className="block w-full flex-grow-0 rounded-sm border-0 px-2 pt-3.5 pb-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                  />
                  {getValues(["startWide", "startSgg", "startDong"])
                    .join(" ")
                    .trim() === "" ? (
                    <div className="flex items-center text-sm min-w-fit gap-x-1 cursor-pointer font-semibold text-gray-300 hover:font-extralight absolute right-2 top-3">
                      <span>주소검색</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                        />
                      </svg>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex gap-x-2 font-Noto">
                <Label title={"상세주소"} required={true} />
                <input
                  {...register(`startDetail`, {
                    required: "상세주소를 입력해주세요.",
                  })}
                  type="text"
                  placeholder="상차지 상세주소"
                  className="w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                />
              </div>
              <div className="text-red-500 mx-auto font-bold text-center">
                {(errors.startAddress || errors.startDetail)?.message}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-y-3">
            <div className="flex gap-x-2">
              <Label title={"상차방법"} required={true} />
              <div className="flex flex-col w-full">
                <select
                  {...register("startLoad", {
                    required: `상차방법을 입력해주세요`,
                  })}
                  className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                >
                  <option value="">상차방법</option>
                  {LOAD_TYPE_LIST.map((item, i) => (
                    <option key={i} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <div className="text-red-500 mx-auto font-bold text-center">
                  {errors.startLoad?.message}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 justify-stretch">
              <div className="flex flex-col">
                <div className="flex w-full gap-x-2">
                  <Label title={"업체명"} required={true} />
                  <input
                    {...register("startCompanyName", {
                      required: "상차지 업체명을 입력해주세요.",
                    })}
                    type="text"
                    placeholder={"상차지 업체명"}
                    className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                  />
                </div>
                <div className="text-red-500 mx-auto font-bold text-center">
                  {errors.startCompanyName?.message}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex w-full gap-x-2">
                  <Label title={"연락처"} required={true} />
                  <input
                    {...register("startAreaPhone", {
                      required: "상차지 전화번호를 입력해주세요.",
                    })}
                    type="tel"
                    maxLength={14}
                    placeholder={"상차지 전화번호"}
                    className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                  />
                </div>
                <div className="text-red-500 mx-auto font-bold text-center">
                  {errors.startAreaPhone?.message}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center pt-3">
          <button
            type="button"
            className="rounded-md bg-mainBlue px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
            onClick={handleSelect}
          >
            {requestType == "I" ? "등록" : "수정"}
          </button>
          <button
            type="button"
            className="ml-3 rounded-md bg-normalGray px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
            onClick={onCancel}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserBookmarkModal;
