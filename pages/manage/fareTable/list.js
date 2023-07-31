import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Modal from "react-modal";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";
import { addCommas } from "../../../utils/StringUtils";

const ManageFareTable = () => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const [fareList, setFareList] = useState([]);
  const [selectedFare, setSelectedFare] = useState({});
  //const [isModalOpen, setIsModalOpen] = useState(false);
  //const router = useRouter();

  /* const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const callbackModal = (retVal) => {
    closeModal();

    const user = { ...selectedFare };
    user = { ...user, auth_code: retVal.auth_code };
    console.log("user > ", user);
    setSelectedFare(() => user);

    updatefareList(user);
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

  const updatefareList = (user) => {
    console.log("selectedFare > ", user);
    const prevfareList = [...fareList];
    prevfareList.forEach((item) => {
      if (item.email === user.email) {
        item.auth_code = user.auth_code;
      }
    });
    //console.log("fareList >> ", fareList);
    //console.log("prevfareList >> ", prevfareList);
    setFareList(() => prevfareList);
  };
  */

  const getFareList = async () => {
    const url = apiPaths.adminGetFare;
    const params = {};

    const result = await requestServer(url, params);
    if (result?.length > 0) {
      result = result.map((item) => ({ ...item, checked: false }));
      setFareList(() => result);
    }
    console.log("Fare list >> ", fareList);
  };

  const handleItemChange = (selectedIndex) => {
    //console.log(fareList);
    let fare = {};
    const updatedList = fareList.map((item, index) => {
      if (index === selectedIndex) {
        if (!item.checked) {
          fare = { ...item };
        }
        item.checked = !item.checked;
      } else {
        item.checked = false;
      }
      return item;
    });

    setFareList(updatedList);
    setSelectedFare(fare);
  };

  useEffect(() => {
    (async () => {
      await getFareList();
    })();
  }, [userInfo]);

  //권한 선택 모달창 open
  const handleAuthChange = () => {
    if (isSelected()) {
      openModal();
    }
  };

  //권한 선택 모달창 open
  const handleDelete = async () => {
    if (isSelected()) {
      const user = { email: selectedFare.email, delete_yn: "Y" };

      const { result, resultCd } = await requestServer(
        apiPaths.adminChangeUser,
        user
      );

      if (resultCd === "00") {
        alert("삭제되었습니다.");
        setSelectedFare({});
        await getFareList();
      } else {
        alert(result);
      }
    }
  };

  const isSelected = () => {
    //console.log("selectedFare > ", selectedFare);
    if (Object.keys(selectedFare).length == 0) {
      alert("사용자를 선택해 주세요.");
      return false;
    } else {
      return true;
    }
  };

  return (
    <div className="pt-10 pb-24 px-5 h-full bg-white">
      {/* <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Modal"
        style={customModalStyles}
      >
        <UserAuthForm
          selectedFare={selectedFare}
          onCancel={closeModal}
          onComplete={callbackModal}
        />
      </Modal> */}
      <div className="flex justify-between">
        <h3 className="text-base font-semibold ">거리별 운행 요금표</h3>
        <p className="text-right">{`${fareList.length} 건`}</p>
      </div>
      <div className="mt-6 pb-24 h-rate8">
        <div className="flex justify-between border-y border-gray-200 py-3 px-5 pr-9 bg-black gap-x-3 text-gray-200 text-center">
          <div className="w-10 shrink-0"></div>
          <div className="grid grid-cols-12 w-full">
            <div className="col-span-2 border-r border-gray-700">상차지</div>
            <div className="col-span-2 border-r border-gray-700">하차지</div>
            <div className="border-r border-gray-700">1톤</div>
            <div className="border-r border-gray-700">2.5톤</div>
            <div className="border-r border-gray-700">3.5톤</div>
            <div className="border-r border-gray-700">5톤</div>
            <div className="border-r border-gray-700">5톤축</div>
            <div className="border-r border-gray-700">11톤</div>
            <div className="border-r border-gray-700">18톤</div>
            <div className="">25톤</div>
          </div>
        </div>
        <ul className="border-y border-gray-200 h-full overflow-auto">
          {fareList.length > 0 &&
            fareList.map((item, index) => {
              const {
                startWide,
                startSgg,
                endWide,
                endSgg,
                oneTon,
                twoHalfTon,
                threeHalfTon,
                fiveTon,
                fiveTonPlus,
                elevenTon,
                eighteenTon,
                twentyfiveTon,
                checked,
              } = item;
              return (
                <li
                  className="border-b border-gray-100 flex justify-between gap-x-3 px-5 hover:bg-gray-100 hover:font-bold text-sm"
                  key={index}
                  onClick={() => handleItemChange(index)}
                >
                  <div className="flex items-center w-10">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="grid grid-cols-12 w-full">
                    <div className="col-span-2 py-5">{`${startWide} ${startSgg}`}</div>
                    <div className="col-span-2 py-5">{`${endWide} ${endSgg}`}</div>
                    <div className="text-right px-3 py-5 bg-slate-100">
                      {addCommas(oneTon)}
                    </div>
                    <div className="text-right px-3 py-5">
                      {addCommas(twoHalfTon)}
                    </div>
                    <div className="text-right px-3 py-5 bg-slate-100">
                      {addCommas(threeHalfTon)}
                    </div>
                    <div className="text-right px-3 py-5">
                      {addCommas(fiveTon)}
                    </div>
                    <div className="text-right px-3 py-5 bg-slate-100">
                      {addCommas(fiveTonPlus)}
                    </div>
                    <div className="text-right px-3 py-5">
                      {addCommas(elevenTon)}
                    </div>
                    <div className="text-right px-3 py-5 bg-slate-100">
                      {addCommas(eighteenTon)}
                    </div>
                    <div className="text-right px-3 py-5">
                      {addCommas(twentyfiveTon)}
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
          className="rounded-md bg-buttonZamboa px-2 py-2 text-base font-semibold text-white shadow-sm"
          onClick={handleAuthChange}
        >
          수정
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

export default ManageFareTable;
