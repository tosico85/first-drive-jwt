import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Modal from "react-modal";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";
import UserAuthForm from "../../components/forms/UserAuthForm";

const ManageUser = () => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const callbackModal = (retVal) => {
    closeModal();

    const user = { ...selectedUser };
    const cpyUserList = [...userList];

    Object.assign(user, retVal);
    setSelectedUser(user);

    cpyUserList.forEach((item) => {
      if (item.email === user.email) {
        item.auth_code = user.auth_code;
      }
    });
    console.log("userList >> ", userList);
    console.log("cpyUserList >> ", cpyUserList);
    setUserList(() => cpyUserList);
  };

  const customModalStyles = {
    content: {
      top: "50%",
      left: "50%",
      width: "80%",
      height: "auto",
      borderRadius: "10px",
      transform: "translate(-50%, -50%)",
    },
  };

  const getUserList = async () => {
    const url = apiPaths.adminGetUserList;
    const params = {};

    const result = await requestServer(url, params);
    setUserList(() => result);
    console.log("User list >> ", userList);
  };

  useEffect(() => {
    (async () => {
      await getUserList();
    })();
  }, [userInfo]);

  //권한 선택 모달창 open
  const handleDetail = (user) => {
    setSelectedUser(user);
    openModal();
  };

  return (
    <div className="py-6">
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Modal"
        style={customModalStyles}
      >
        <UserAuthForm
          selectedUser={selectedUser}
          onCancel={closeModal}
          onComplete={callbackModal}
        />
      </Modal>
      <h3 className="text-base font-semibold leading-7 ">가입된 사용자 목록</h3>
      <p className="text-right">{`${userList.length} 건`}</p>
      <ul className="mt-6 border-y border-gray-200 dark:border-gray-300">
        {userList.length > 0 &&
          userList.map((item, index) => {
            const { name, email, company_code, auth_code, create_dtm } = item;
            return (
              <li
                className="border-b border-gray-100 dark:border-gray-200 flex justify-between gap-x-6 py-5 lg:px-5 hover:bg-gray-100"
                key={index}
                onClick={() => handleDetail(item)}
              >
                <div className="grid gap-x-5 w-full grid-cols-6">
                  <p className="col-span-3 lg:col-span-1 text-sm font-semibold leading-6 text-gray-500 dark:text-gray-300">
                    {email}
                  </p>
                  <p className="text-right lg:col-span-3 lg:text-left text-sm font-semibold leading-6 text-gray-500 dark:text-gray-300">
                    {name}
                  </p>
                  <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-5 justify-end">
                    <div className="flex justify-end">
                      <p
                        className={
                          "text-sm w-fit h-fit text-white font-bold dark:text-gray-300 px-2 py-1 rounded-full " +
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
                    <p className="text-right text-sm font-semibold leading-6 text-gray-500 dark:text-gray-300">
                      {create_dtm.substring(0, 10)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
      </ul>
      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button
          type="button"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          onClick={() => router.push("/orders/create")}
        >
          화물 등록
        </button>
      </div>
    </div>
  );
};

export default ManageUser;
