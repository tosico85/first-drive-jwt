import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import Modal from "react-modal";
import apiPaths from "../../../services/apiRoutes";
import GroupInputModal from "../../components/modals/GroupInputModal";
import AuthContext from "../../context/authContext";

const ManageGroup = () => {
  const { requestServer } = useContext(AuthContext);
  const [groupList, setGroupList] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const callbackModal = () => {
    setSelectedGroup({});
    getGroupList();

    closeModal();
  };

  const customModalStyles = {
    content: {
      top: "50%",
      left: "50%",
      width: "320px",
      height: "auto",
      borderRadius: "10px",
      transform: "translate(-50%, -50%)",
      boxShadow: "0px 0px 10px #e2e2e2",
    },
  };

  const getGroupList = async () => {
    const url = apiPaths.adminGetGroup;
    const params = {};

    const result = await requestServer(url, params);
    if (result?.length > 0) {
      result = result.map((item) => ({ ...item, checked: false }));
      setGroupList(() => result);
    }
    //console.log("Group list >> ", groupList);
  };

  const handleItemChange = (group_code) => {
    //console.log(groupList);ㄹ
    let group = {};
    const updatedList = groupList.map((item) => {
      if (item.group_code === group_code) {
        if (!item.checked) {
          group = { ...item };
        }
        item.checked = !item.checked;
      } else {
        item.checked = false;
      }
      return item;
    });

    setGroupList(updatedList);
    setSelectedGroup(group);
  };

  useEffect(() => {
    (async () => {
      await getGroupList();
    })();
  }, []);

  //그룹 추가 모달창 open
  const handleGroupInsert = () => {
    openModal();
  };

  //그룹 수정 모달창 open
  const handleGroupChange = () => {
    if (isSelected()) {
      openModal();
    }
  };

  //그룹 삭제
  const handleDelete = async () => {
    if (isSelected()) {
      const { result, resultCd } = await requestServer(apiPaths.adminDelGroup, {
        group_code: selectedGroup.group_code,
      });

      if (resultCd === "00") {
        alert("삭제되었습니다.");
        setSelectedGroup({});
        await getGroupList();
      } else {
        alert(result);
      }
    }
  };

  const isSelected = () => {
    //console.log("selectedGroup > ", selectedGroup);
    if (Object.keys(selectedGroup).length == 0) {
      alert("그룹을 선택해 주세요.");
      return false;
    } else {
      return true;
    }
  };

  return (
    <div className="pt-10 pb-24 px-5 h-full bg-white">
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Modal"
        style={customModalStyles}
      >
        <GroupInputModal
          selectedGroup={selectedGroup}
          onCancel={closeModal}
          onComplete={callbackModal}
        />
      </Modal>
      <div className="flex justify-between">
        <h3 className="text-base font-semibold ">관리그룹 목록</h3>
        <p className="text-right">{`${groupList.length} 건`}</p>
      </div>
      <div className="mt-6 pb-24 h-rate8">
        <ul className="border-y border-gray-200 h-full overflow-auto">
          {groupList.length > 0 ? (
            groupList.map((item, index) => {
              const { checked, group_code, name, memo, create_dtm } = item;
              return (
                <li
                  className="border-b border-gray-100 flex justify-between gap-x-3 py-5 lg:px-5 hover:bg-gray-100"
                  key={index}
                  onClick={() => handleItemChange(group_code)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="grid gap-x-5 w-full grid-cols-8 items-center">
                    <p className="col-span-2 text-sm font-semibold leading-6 text-gray-500">
                      {name}
                    </p>
                    <p className="text-center col-span-4 lg:text-left text-sm font-semibold leading-6 text-gray-500">
                      {memo}
                    </p>
                    <div className="col-span-2 justify-end">
                      <p className="hidden lg:block text-right text-sm font-semibold leading-6 text-gray-500">
                        {create_dtm.substring(0, 10)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="py-10 bg-gray-100">
              <p className="text-center text-gray-700">조회 내역이 없습니다.</p>
            </li>
          )}
        </ul>
      </div>

      <div className="fixed bottom-0 left-0 p-3 w-full bg-white border mt-6 flex items-center justify-end gap-x-3">
        <button
          type="button"
          onClick={() => router.push("/orders/list")}
          className="rounded-md bg-normalGray px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm lg:hidden"
        >
          목록으로
        </button>
        <button
          type="button"
          className="rounded-md bg-buttonZamboa px-2 py-2 text-base font-semibold text-white shadow-sm"
          onClick={handleGroupInsert}
        >
          그룹 추가
        </button>
        <button
          type="button"
          className="rounded-md bg-buttonZamboa px-2 py-2 text-base font-semibold text-white shadow-sm"
          onClick={handleGroupChange}
        >
          그룹 수정
        </button>
        <button
          type="button"
          className="rounded-md bg-buttonZamboa px-2 py-2 text-base font-semibold text-white shadow-sm"
          onClick={handleDelete}
        >
          삭제
        </button>
      </div>
    </div>
  );
};

export default ManageGroup;
