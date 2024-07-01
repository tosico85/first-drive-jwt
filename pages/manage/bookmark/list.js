import { useContext, useEffect, useState } from "react";
import Modal from "react-modal";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";
import SearchAddressModal from "../../components/modals/SearchAddressModal";
import Label from "../../components/custom/Label";
import Script from "next/script";
import { useInput, useInputBase } from "../../../hooks/useInput";
import { formatPhoneNumber } from "../../../utils/StringUtils";
import ComboBox from "../../components/custom/ComboBox";

const ManageBookmark = () => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const [bookmarkList, setBookmarkList] = useState([]);
  const [selectedBookmark, setSelectedBookmark] = useState({});
  const [requestType, setRequestTyoe] = useState("I");

  const isAdmin = userInfo.auth_code === "ADMIN";
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupList, setGroupList] = useState([]);

  // search input
  const searchName = useInput("");

  // input map set
  const inputMap = {
    bookmarkName: useInputBase(""),
    mainAddress: useInputBase(""),
    detail: useInputBase(""),
    areaPhone: useInputBase(""),
  };

  //Modal control
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      console.log(userInfo);
      await getGroupList();
      await getBookmarkList();
    })();
  }, [userInfo]);

  useEffect(() => {
    (async () => {
      await getBookmarkList();
    })();
  }, [selectedGroup]);

  useEffect(() => {
    inputMap["mainAddress"].setValue(
      `${selectedBookmark["wide"] || ""} ${selectedBookmark["sgg"] || ""} ${
        selectedBookmark["dong"] || ""
      }`
    );
    inputMap["detail"].setValue(selectedBookmark["detail"] || "");
    inputMap["bookmarkName"].setValue(selectedBookmark["bookmarkName"] || "");
    inputMap["areaPhone"].setValue(selectedBookmark["areaPhone"] || "");

    setRequestTyoe(isSelected() ? "U" : "I");
  }, [selectedBookmark]);

  /********************** API Call Method Start *******************************/

  // 그룹목록 조회
  const getGroupList = async () => {
    const url = apiPaths.commonGetGroup;
    const params = {};

    let result = await requestServer(url, params);
    if (result?.length > 0) {
      result = result.map((item) => ({
        value: item.group_code + "",
        name: item.name,
      }));

      if (isAdmin) {
        result = [{ value: "", name: "전체" }, ...result];
      } else {
        result = result.filter((item) => {
          return item.value == userInfo.group_code;
        });
      }

      setGroupList(() => result);
    }
  };

  // 거래처 조회
  const getBookmarkList = async () => {
    const url = apiPaths.userBookmarkList;
    const params = {
      bookmarkName: searchName.value,
      group_code: selectedGroup,
    };

    const result = await requestServer(url, params);
    result = result.map((item) => ({ ...item, checked: false }));
    setBookmarkList(() => result);
    setSelectedBookmark({});
    //console.log("bookmark list >> ", bookmarkList);
  };

  const deleteBookmark = async () => {
    const paramData = (({ bookmarkName, ...rest }) => ({
      bookmarkName,
    }))(selectedBookmark);

    const { result, resultCd } = await requestServer(apiPaths.userBookmarkDel, {
      ...paramData,
    });

    if (resultCd === "00") {
      alert("삭제되었습니다.");
      setSelectedBookmark({});
      await getBookmarkList();
    } else {
      alert("삭제에 실패했습니다.");
    }
  };

  const insertBookmark = async () => {
    const paramData = {
      bookmarkName: inputMap["bookmarkName"].value,
      wide: selectedBookmark["wide"],
      sgg: selectedBookmark["sgg"],
      dong: selectedBookmark["dong"],
      detail: inputMap["detail"].value,
      areaPhone: inputMap["areaPhone"].value,
    };

    const { result, resultCd } = await requestServer(
      apiPaths.userBookmarkAdd,
      paramData
    );

    if (resultCd === "00") {
      alert("등록되었습니다.");
      await getBookmarkList();
    } else {
      alert("등록실패");
    }
  };

  const updateBookmark = async () => {
    const paramData = {
      bookmarkName: selectedBookmark["bookmarkName"],
      wide: selectedBookmark["wide"],
      sgg: selectedBookmark["sgg"],
      dong: selectedBookmark["dong"],
      detail: inputMap["detail"].value,
      areaPhone: inputMap["areaPhone"].value,
    };

    const { result, resultCd } = await requestServer(
      apiPaths.userBookmarkUpdate,
      paramData
    );

    if (resultCd === "00") {
      alert("수정되었습니다.");
      await getBookmarkList();
    } else {
      alert("수정실패");
    }
  };

  /********************** API Call Method End *******************************/

  /********************** Event Control Start *******************************/

  const handleSearch = async (e) => {
    const { key } = e;

    if (key == "Enter") {
      await getBookmarkList();
    }
  };

  const handleItemChange = (selectedIndex) => {
    //console.log(bookmarkList);
    let bookmark = {};
    const updatedList = bookmarkList.map((item, index) => {
      if (index === selectedIndex) {
        if (!item.checked) {
          bookmark = { ...item };
        }
        item.checked = !item.checked;
      } else {
        item.checked = false;
      }
      return item;
    });

    setBookmarkList(updatedList);
    setSelectedBookmark(bookmark);
  };

  const handleBookmarkInsert = async () => {
    if (requestType == "I") {
      await insertBookmark();
    }
  };

  const handleBookmarkUpdate = async () => {
    if (requestType == "U") {
      await updateBookmark();
    }
  };

  //권한 선택 모달창 open
  const handleDelete = async () => {
    if (isSelected()) {
      await deleteBookmark();
    }
  };

  const isSelected = () => {
    //console.log("selectedBookmark > ", selectedBookmark);
    if (bookmarkList.filter((item) => item.checked).length == 0) {
      return false;
    } else {
      return true;
    }
  };

  /********************** Event Control End *********************************/

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
      let bookmark = { ...selectedBookmark };
      bookmark["wide"] = retVal["wide"];
      bookmark["sgg"] = retVal["sgg"];
      bookmark["dong"] = retVal["dong"];
      bookmark["detail"] = retVal["detail"];
      setSelectedBookmark(bookmark);
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
    <div className="pb-24 px-5 h-full bg-white">
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" />
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
      <div className="grid grid-cols-10 w-full">
        <div className="mt-6 pb-24 col-span-6 h-rate8">
          <div className="grid grid-cols-5 items-center mb-3">
            <div className="col-span-4 flex justify-start gap-x-3">
              <div className="flex gap-x-5 items-center w-full">
                <h3 className="text-base font-semibold whitespace-nowrap">
                  그룹 선택
                </h3>
                <ComboBox
                  onComboChange={setSelectedGroup}
                  list={groupList}
                  selectedValue={selectedGroup}
                />
              </div>
              <div className="flex gap-x-5 items-center w-full">
                <h3 className="text-base font-semibold whitespace-nowrap">
                  업체명 검색
                </h3>
                <input
                  type="text"
                  placeholder={"업체명"}
                  {...searchName}
                  onKeyDown={handleSearch}
                  className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                />
              </div>
            </div>
            <p className="text-right">{`${bookmarkList.length} 건`}</p>
          </div>
          <div className="flex justify-between border-y border-gray-200 py-3 bg-headerColor2 text-gray-200 text-center">
            <div className="grid grid-cols-12 w-full">
              <div className="col-span-1"></div>
              <div className="col-span-2 border-l border-gray-700">그룹명</div>
              <div className="col-span-3 border-l border-gray-700">업체명</div>
              <div className="col-span-3 border-l border-gray-700">주소</div>
              <div className="col-span-3 border-l border-gray-700">연락처</div>
            </div>
          </div>
          <ul className="h-full overflow-auto border border-slate-200">
            {bookmarkList.length > 0 ? (
              <>
                {bookmarkList.map((item, index) => {
                  const {
                    group_name,
                    bookmarkName,
                    wide,
                    sgg,
                    dong,
                    detail,
                    areaPhone,
                    checked,
                  } = item;
                  return (
                    <li
                      className="grid grid-cols-12 border-b border-gray-100 hover:bg-gray-100 hover:font-bold text-sm"
                      key={index}
                      onClick={() => handleItemChange(index)}
                    >
                      <div className="flex items-center justify-center border-r border-slate-200">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                      </div>
                      <div className="px-3 py-5 col-span-2 border-r border-slate-200">
                        {group_name}
                      </div>
                      <div className="px-3 py-5 col-span-3 border-r border-slate-200">
                        {bookmarkName}
                      </div>
                      <div className="px-3 py-5 col-span-3 border-r border-slate-200">
                        <div>{`${wide} ${sgg} ${dong}`}</div>
                        <div>{`${detail}`}</div>
                      </div>
                      <div className="px-3 py-5 col-span-3">
                        {formatPhoneNumber(areaPhone)}
                      </div>
                    </li>
                  );
                })}
              </>
            ) : (
              <li className="flex items-center justify-center p-10 bg-gray-100">
                <p>등록된 거래처정보가 없습니다.</p>
              </li>
            )}
          </ul>
        </div>
        <div className="flex flex-col justify-center gap-y-3 pl-5 ml-5 p-5 col-span-4 border-l border-slate-200">
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
                      {...{
                        value: inputMap["mainAddress"].value,
                        onChange: inputMap["mainAddress"].onChange,
                      }}
                      className="block w-full flex-grow-0 rounded-sm border-0 px-2 pt-3.5 pb-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                    />
                    {`${inputMap["mainAddress"].value.trim()}` === "" ? (
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
                  <Label title={"상세주소"} required={false} />
                  <input
                    {...{
                      value: inputMap["detail"].value,
                      onChange: inputMap["detail"].onChange,
                    }}
                    type="text"
                    placeholder="상차지 상세주소"
                    className="w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-y-3">
              <div className="grid grid-cols-2 gap-x-3 justify-stretch">
                <div className="flex flex-col">
                  <div className="flex w-full gap-x-2">
                    <Label title={"업체명"} required={true} />
                    <input
                      {...{
                        value: inputMap["bookmarkName"].value,
                        onChange: inputMap["bookmarkName"].onChange,
                      }}
                      type="text"
                      placeholder={"업체명"}
                      readOnly={requestType == "U"}
                      className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex w-full gap-x-2">
                    <Label title={"연락처"} required={false} />
                    <input
                      {...{
                        value: inputMap["areaPhone"].value,
                        onChange: inputMap["areaPhone"].onChange,
                      }}
                      type="tel"
                      maxLength={11}
                      placeholder={"전화번호"}
                      className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center pt-3">
            <button
              type="button"
              className="rounded-md bg-mainBlue px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
              onClick={() => {
                if (requestType == "I") {
                  handleBookmarkInsert();
                } else {
                  handleBookmarkUpdate();
                }
              }}
            >
              {requestType == "I" ? "등록" : "수정"}
            </button>
            {requestType == "U" && (
              <button
                type="button"
                className="ml-3 rounded-md bg-mainBlue px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
                onClick={handleDelete}
              >
                삭제
              </button>
            )}
            <button
              type="button"
              className="ml-3 rounded-md bg-normalGray px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
              onClick={() => {}}
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBookmark;
