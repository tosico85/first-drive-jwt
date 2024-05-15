import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Modal from "react-modal";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";
import UserAuthModal from "../../components/modals/UserAuthModal";
import UserPasswordSetModal from "../../components/modals/UserPasswordSetModal";

const ManageUser = () => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] =
    useState(false);
  const router = useRouter();

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const callbackModal = async () => {
    closeModal();

    setSelectedUser({});
    await getUserList();

    //updateUserList(user);
  };

  const openPasswordChangeModal = () => {
    setIsPasswordChangeModalOpen(true);
  };

  const closePasswordChangeModal = () => {
    setIsPasswordChangeModalOpen(false);
  };

  const callbackPasswordChangeModal = async () => {
    closePasswordChangeModal();
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

  const customModalStyles_password = {
    content: { ...customModalStyles.content, height: "200px" },
  };

  const getUserList = async () => {
    const url = apiPaths.adminGetUserList;
    const params = {};

    const result = await requestServer(url, params);
    if (result?.length > 0) {
      result = result.map((item) => ({ ...item, checked: false }));
      setUserList(() => result);
    }
    console.log("User list >> ", userList);
  };

  const handleItemChange = (email) => {
    //console.log(userList);
    let user = {};
    const updatedList = userList.map((item) => {
      if (item.email === email) {
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

  useEffect(() => {
    (async () => {
      await getUserList();
    })();
  }, [userInfo]);

  //권한 선택 모달창 open
  const handleAuthChange = () => {
    if (isSelected()) {
      openModal();
    }
  };

  //권한 선택 모달창 open
  const handlePasswordChange = () => {
    if (isSelected()) {
      openPasswordChangeModal();
    }
  };

  //권한 선택 모달창 open
  const handleDelete = async () => {
    if (isSelected()) {
      const user = { email: selectedUser.email, delete_yn: "Y" };

      const { result, resultCd } = await requestServer(
        apiPaths.adminChangeUser,
        user
      );

      if (resultCd === "00") {
        alert("삭제되었습니다.");
        setSelectedUser({});
        await getUserList();
      } else {
        alert(result);
      }
    }
  };

  const isSelected = () => {
    //console.log("selectedUser > ", selectedUser);
    if (Object.keys(selectedUser).length == 0) {
      alert("사용자를 선택해 주세요.");
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
        <UserAuthModal
          selectedUser={selectedUser}
          onCancel={closeModal}
          onComplete={callbackModal}
        />
      </Modal>
      <Modal
        isOpen={isPasswordChangeModalOpen}
        onRequestClose={closePasswordChangeModal}
        contentLabel="Modal"
        style={customModalStyles_password}
      >
        <UserPasswordSetModal
          selectedUser={selectedUser}
          onCancel={closePasswordChangeModal}
          onComplete={callbackPasswordChangeModal}
        />
      </Modal>
      <div className="flex justify-between">
        <h3 className="text-base font-semibold ">가입된 사용자 목록</h3>
        <p className="text-right">{`${userList.length} 건`}</p>
      </div>
      <div className="mt-6 pb-24 h-rate8">
        <ul className="border-y border-gray-200 h-full overflow-auto">
          {userList.length > 0 &&
            userList.map((item, index) => {
              const {
                name,
                email,
                group_code,
                group_name,
                auth_code,
                create_dtm,
              } = item;
              return (
                <li
                  className="border-b border-gray-100 flex justify-between gap-x-3 py-5 lg:px-5 hover:bg-gray-100"
                  key={index}
                  onClick={() => handleItemChange(item.email)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="grid gap-x-5 w-full grid-cols-6 items-center">
                    <p className="col-span-3 lg:col-span-1 text-sm font-semibold leading-6 text-gray-500">
                      {email}
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 col-span-2 lg:col-span-3 lg:text-left">
                      <p className="text-center text-sm font-semibold leading-6 text-gray-500">
                        {name}
                      </p>
                      <p className="text-center text-sm font-semibold leading-6 text-mainColor3">
                        {group_name}
                      </p>
                    </div>
                    <div className="col-span-1 lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-y-3 gap-x-5 justify-end">
                      <div className="flex justify-end">
                        <p
                          className={
                            "text-sm w-16 text-center h-fit text-white font-bold px-2 py-1 rounded-full " +
                            (auth_code == "USER"
                              ? "bg-indigo-400 ring-indigo-400"
                              : auth_code == "ADMIN"
                              ? "bg-orange-400 ring-orange-400"
                              : "bg-slate-400 ring-slate-400")
                          }
                        >
                          {auth_code}
                        </p>
                      </div>
                      <p className="hidden lg:block text-right text-sm font-semibold leading-6 text-gray-500">
                        {create_dtm.substring(0, 10)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
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
          onClick={handlePasswordChange}
        >
          사용자 비밀번호 수정
        </button>
        <button
          type="button"
          className="rounded-md bg-buttonZamboa px-2 py-2 text-base font-semibold text-white shadow-sm"
          onClick={handleAuthChange}
        >
          사용자정보 수정
        </button>
        <button
          type="button"
          className="rounded-md bg-buttonZamboa px-2 py-2 text-base font-semibold text-white shadow-sm"
          onClick={handleAuthChange}
        >
          사용자정보 수정
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

export default ManageUser;
