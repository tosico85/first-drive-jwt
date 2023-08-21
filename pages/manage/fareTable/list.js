import { useContext, useEffect, useState } from "react";
import Modal from "react-modal";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";
import { addCommas } from "../../../utils/StringUtils";
import FareInputModal from "../../components/modals/FareInputModal";

const ManageFareTable = () => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const [fareList, setFareList] = useState([]);
  const [selectedFare, setSelectedFare] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestType, setRequestTyoe] = useState("");
  //const router = useRouter();

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const callbackModal = () => {
    closeModal();

    setSelectedFare({});
    getFareList();
  };

  const customModalStyles = {
    content: {
      top: "50%",
      left: "50%",
      width: "400px",
      height: "750px",
      borderRadius: "10px",
      transform: "translate(-50%, -50%)",
      boxShadow: "0px 0px 10px #e2e2e2",
    },
  };

  const getFareList = async () => {
    const url = apiPaths.adminGetFare;
    const params = {};

    const result = await requestServer(url, params);
    if (result?.length > 0) {
      result = result.map((item) => ({ ...item, checked: false }));
      setFareList(() => result);
    }
    //console.log("Fare list >> ", fareList);
  };

  const handleItemChange = (selectedIndex) => {
    console.log(fareList);
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
  const handleFareInsert = () => {
    setRequestTyoe("I");
    openModal();
  };

  //권한 선택 모달창 open
  const handleFareUpdate = () => {
    if (isSelected()) {
      setRequestTyoe("U");
      openModal();
    }
  };

  //권한 선택 모달창 open
  const handleDelete = async () => {
    if (isSelected()) {
      const paramData = (({
        startWide,
        startSgg,
        endWide,
        endSgg,
        ...rest
      }) => ({ startWide, startSgg, endWide, endSgg }))(selectedFare);

      const { result, resultCd } = await requestServer(
        apiPaths.adminDelFare,
        paramData
      );

      if (resultCd === "00") {
        alert("삭제되었습니다.");
        setSelectedFare({});
        await getFareList();
      } else {
        alert("삭제에 실패했습니다.");
      }
    }
  };

  const isSelected = () => {
    //console.log("selectedFare > ", selectedFare);
    if (Object.keys(selectedFare).length == 0) {
      alert("수정할 항목을 선택해 주세요.");
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
        <FareInputModal
          selectedFare={requestType == "U" ? selectedFare : {}}
          onCancel={closeModal}
          onComplete={callbackModal}
        />
      </Modal>
      <div className="flex justify-between">
        <h3 className="text-base font-semibold ">거리별 운행 요금표</h3>
        <p className="text-right">{`${fareList.length} 건`}</p>
      </div>
      <div className="mt-6 pb-24 h-rate8">
        <div className="flex justify-between border-y border-gray-200 py-3 px-5 pr-9 bg-headerColor2 gap-x-3 text-gray-200 text-center">
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
                    <div className="col-span-2 px-3 py-5">{`${startWide} ${startSgg}`}</div>
                    <div className="col-span-2 px-3 py-5">{`${endWide} ${endSgg}`}</div>
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
          onClick={handleFareInsert}
        >
          추가
        </button>
        <button
          type="button"
          className="rounded-md bg-buttonZamboa px-2 py-2 text-base font-semibold text-white shadow-sm"
          onClick={handleFareUpdate}
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
