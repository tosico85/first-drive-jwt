import { useContext, useEffect, useState } from "react";
import AuthContext from "../../context/authContext";
import apiPaths from "../../../services/apiRoutes";
import { useInput } from "../../../hooks/useInput";
import ComboBox from "../custom/ComboBox";

const UserAccountSelectModal = ({ onCancel, onComplete }) => {
  const { requestServer } = useContext(AuthContext);
  const [userList, setUserList] = useState([]);
  const [groupList, setGroupList] = useState([]);
  const [selectedUser, setSelectedUser] = useState({});

  // search input
  const searchName = useInput("");

  useEffect(() => {
    (async () => {
      await getGroupList();
      await getUserList();
    })();
  }, []);

  /********************** API Call Method Start *******************************/

  // 그룹리스트(콤보박스용) 조회
  const getGroupList = async () => {
    const url = apiPaths.commonGetGroup;

    let result = await requestServer(url, {});
    result = result.map((item) => ({
      value: item.group_code,
      name: item.name,
    }));
    result = [{ name: "전체", value: "" }, ...result];
    setGroupList(() => result);
  };

  // 사용자 조회
  const getUserList = async (group_code = "") => {
    const url = apiPaths.adminGetUserList;
    const params = { group_code };

    const result = await requestServer(url, params);
    result = result.map((item) => ({ ...item, checked: false }));
    setUserList(() => result);
    setSelectedUser({});
    //console.log("bookmark list >> ", userList);
  };

  /********************** API Call Method End *********************************/

  /********************** Event Control Start *********************************/

  const handleItemChange = (selectedIndex) => {
    //console.log(userList);
    let user = {};
    const updatedList = userList.map((item, index) => {
      if (index === selectedIndex) {
        if (!item.checked) {
          user = { ...item };
        }
        item.checked = !item.checked;
      } else {
        item.checked = false;
      }
      return item;
    });

    setUserList(updatedList);
    setSelectedUser(user);
  };

  const handleSelect = () => {
    const user = userList.find((item) => item.checked == true);
    if (!user) {
      alert("계정을 선택해주세요.");
      return;
    }
    onComplete(user.email);
  };

  /********************** Event Control End ***********************************/

  return (
    <div className="h-full bg-white">
      <div className="h-full pb-24">
        <div className="grid grid-cols-3 items-center mb-5">
          <div className="col-span-2 grid grid-cols-3 gap-x-5 items-center w-full">
            <h3 className="text-base font-semibold w-full">그룹 선택</h3>
            <div className="col-span-2">
              <ComboBox onComboChange={getUserList} list={groupList} />
            </div>
          </div>
          <p className="text-right">{`${userList.length} 건`}</p>
        </div>
        <div className="flex justify-between border-y border-gray-200 py-3 bg-headerColor2 text-gray-200 text-center">
          <div className="grid grid-cols-12 w-full">
            <div className="col-span-1"></div>
            <div className="col-span-4 border-l border-gray-700">계정</div>
            <div className="col-span-3 border-l border-gray-700">이름</div>
            <div className="col-span-4 border-l border-gray-700">그룹명</div>
          </div>
        </div>
        <ul className="h-4/5 overflow-auto border border-slate-200">
          {userList.length > 0 ? (
            <>
              {userList.map((item, index) => {
                const { checked, email, name, group_name } = item;
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
                    <div className="px-3 py-2 col-span-4 border-r border-slate-200">
                      {email}
                    </div>
                    <div className="px-3 py-2 col-span-3 border-r border-slate-200">
                      <div>{name}</div>
                    </div>
                    <div className="px-3 py-2 col-span-4">{group_name}</div>
                  </li>
                );
              })}
            </>
          ) : (
            <li className="flex items-center justify-center p-10 bg-gray-100">
              <p>등록된 사용자정보가 없습니다.</p>
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

export default UserAccountSelectModal;
