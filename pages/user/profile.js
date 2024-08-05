import { useContext, useState } from "react";
import Modal from "react-modal";
import UserPasswordSetModal from "../components/modals/UserPasswordSetModal";
import AuthContext from "../context/authContext";

const UserProfile = () => {
  const { userInfo, logout } = useContext(AuthContext);
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] =
    useState(false);

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
      height: "200px",
      borderRadius: "10px",
      transform: "translate(-50%, -50%)",
      boxShadow: "0px 0px 10px #e2e2e2",
    },
  };

  return (
    <div className="w-full h-full flex flex-col items-center">
      <Modal
        isOpen={isPasswordChangeModalOpen}
        onRequestClose={closePasswordChangeModal}
        contentLabel="Modal"
        style={customModalStyles}
      >
        <UserPasswordSetModal
          selectedUser={{ email: userInfo.email }}
          onCancel={closePasswordChangeModal}
          onComplete={callbackPasswordChangeModal}
        />
      </Modal>
      <div className="bg-white flex items-center justify-center w-full py-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-36 h-36"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <div className="flex flex-col w-full h-full py-10 px-5 bg-white lg:items-center">
        <div className="bg-white flex flex-col p-5 gap-y-5">
          <div className="flex px-5 gap-x-5">
            <div className="flex items-end pb-1">
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
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-lg font-bold">Name</span>
              <span className=" text-xl font-extrabold">{userInfo.name}</span>
            </div>
          </div>
          <div className="flex px-5 gap-x-5">
            <div className="flex items-end pb-1">
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
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-lg font-bold">email</span>
              <span className=" text-xl font-extrabold">{userInfo.email}</span>
            </div>
          </div>
          <div className="w-full h-full pb-16 flex items-end justify-center">
            <button
              type="button"
              onClick={openPasswordChangeModal}
              className="inline rounded-md bg-slate-500 px-5 py-2 text-base font-semibold text-white hover.shadow-sm"
            >
              비밀번호 변경
            </button>
          </div>
        </div>
        <div className="w-full h-full pb-16 flex items-end justify-center">
          <button
            type="button"
            onClick={logout}
            className="inline rounded-sm bg-mainColor2 px-10 py-2 text-xl font-semibold text-white hover.shadow-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
