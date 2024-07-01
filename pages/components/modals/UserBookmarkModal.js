import { useContext, useEffect, useState } from "react";
import AuthContext from "../../context/authContext";
import apiPaths from "../../../services/apiRoutes";
import { useInput } from "../../../hooks/useInput";
import { formatPhoneNumber, isEmpty } from "../../../utils/StringUtils";
import ComboBox from "../custom/ComboBox";

const UserBookmarkModal = ({ startEnd, onCancel, onComplete }) => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const [bookmarkList, setBookmarkList] = useState([]);
  const [selectedBookmark, setSelectedBookmark] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupList, setGroupList] = useState([]);

  const isAdmin = userInfo.auth_code === "ADMIN";

  // search input
  const searchName = useInput("");

  useEffect(() => {
    (async () => {
      await getGroupList();
      await getBookmarkList();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      await getBookmarkList();
    })();
  }, [selectedGroup]);

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

  /********************** API Call Method End *********************************/

  /********************** Event Control Start *********************************/

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

  const handleSelect = () => {
    const bookmark = bookmarkList.find((item) => item.checked == true);
    if (!bookmark) {
      alert("주소를 선택해주세요.");
      return;
    }
    onComplete(bookmark);
  };

  /********************** Event Control End ***********************************/

  return (
    <div className="h-full bg-white">
      <div className="h-full pb-24">
        <div className="flex justify-between items-center mb-5">
          <div className="grid grid-cols-12 justify-start gap-x-3">
            <div className="col-span-5 flex gap-x-5 items-center w-full">
              <h3 className="text-base font-semibold whitespace-nowrap">
                그룹 선택
              </h3>
              <ComboBox
                onComboChange={setSelectedGroup}
                list={groupList}
                selectedValue={selectedGroup}
              />
            </div>
            <div className="col-span-7 grid grid-cols-3 gap-x-5 items-center w-72">
              <h3 className="text-base font-semibold w-full">업체명 검색</h3>
              <input
                type="text"
                placeholder={"업체명"}
                {...searchName}
                onKeyDown={handleSearch}
                className="block w-full col-span-2 rounded-sm border-0 px-2 py-2 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
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
        <ul className="h-4/5 overflow-auto border border-slate-200">
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

                    <div className="px-3 py-2 col-span-3 border-r border-slate-200">
                      {bookmarkName}
                    </div>
                    <div className="px-3 py-2 col-span-3 border-r border-slate-200">
                      <div>{`${wide} ${sgg} ${dong}`}</div>
                      <div>{`${detail}`}</div>
                    </div>
                    <div className="px-3 py-2 col-span-3">
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
        <div className="text-center mt-5">
          <button
            type="button"
            className="rounded-md bg-mainBlue px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
            onClick={handleSelect}
          >
            선택
          </button>
          <button
            type="button"
            className="ml-3 rounded-md bg-normalGray px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
            onClick={onCancel}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserBookmarkModal;
