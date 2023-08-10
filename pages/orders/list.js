import { useContext, useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import AuthContext from "../context/authContext";
import { useRouter } from "next/router";
import Modal from "react-modal";
import {
  addCommas,
  formatDate,
  getOneWeekAgoDate,
  getTodayDate,
} from "../../utils/StringUtils";
import { formatPhoneNumber } from "../../utils/StringUtils";
import DateInput from "../components/custom/DateInput";
import { useInput } from "../../hooks/useInput";
import DirectAllocModal from "../components/modals/DirectAllocModal";
import XLSX from "xlsx";
import FileSaver from "file-saver";

const downloadExcel = () => {
  const filteredData = filteredCargoList(); // 여기서 필터된 데이터를 가져옵니다.

  const formattedData = filteredData.map((item) => ({
    // 여기서 필요한 데이터를 객체 형태로 변환합니다.
    // 예시: cargo_seq, ordNo, startPlanDt 등
    // 예시로 넣어둔 데이터들을 포함하여 필요한 데이터를 추가합니다.
    cargo_seq: item.cargo_seq,
    ordNo: item.ordNo,
    startPlanDt: item.startPlanDt,
    // ...
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Cargo Data");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  FileSaver.saveAs(blob, "cargo_data.xlsx");
};

const CargoList = () => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const [cargoOrder, setCargoOrder] = useState([]);
  const [searchStatus, setSearchStatus] = useState("ALL");
  const [startSearchDt, setStartSearchDt] = useState(getOneWeekAgoDate());
  const [endSearchDt, setEndSearchDt] = useState(getTodayDate());
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState({});
  //const [companySearch, setCompanySearch] = useState("");
  const companySearch = useInput("");
  const router = useRouter();

  const isAdmin = userInfo.auth_code === "ADMIN";

  const getOrderList = async () => {
    const url =
      userInfo.auth_code == "ADMIN"
        ? apiPaths.adminGetCargoOrder
        : apiPaths.custReqGetCargoOrder;

    //console.log(userInfo);
    //console.log(url);
    const params = {
      start_dt: startSearchDt,
      end_dt: endSearchDt,
      company_nm: companySearch.value,
    };

    const result = await requestServer(url, params);
    setCargoOrder(() => result);
    //console.log("Cargo order >>", cargoOrder);
  };

  useEffect(() => {
    (async () => {
      await getOrderList();
    })();
  }, [userInfo, startSearchDt, endSearchDt]);

  const handleCompanySearch = async (e) => {
    const {
      key,
      target: { value },
    } = e;

    if (key == "Enter") {
      await getOrderList();
    }
  };

  /*** Modal Controller ***/
  const openAllocModal = () => {
    setIsAllocModalOpen(true);
  };

  const closeAllocModal = () => {
    setIsAllocModalOpen(false);
  };

  const callbackAllocModal = () => {
    closeAllocModal();
    (async () => {
      await getOrderList();
    })();
  };

  const customModalStyles = {
    content: {
      top: "50%",
      left: "50%",
      width: "360px",
      height: "660px",
      borderRadius: "10px",
      transform: "translate(-50%, -50%)",
      boxShadow: "0px 0px 10px #e2e2e2",
    },
  };

  //상세보기
  const handleDetail = (cargo_seq) => {
    router.push({
      pathname: "/orders/detail",
      query: { param: cargo_seq },
    });
  };

  //화물복사
  const handleCargoCopy = (cargo_seq) => {
    const copyCargoItem = {
      ...cargoOrder.find((item) => item.cargo_seq === cargo_seq),
    };

    //수정 건이므로 cargo_seq 삭제
    const paramData = (({
      cargo_seq,
      ordNo,
      startPlanDt,
      startPlanHour,
      startPlanMinute,
      endPlanDt,
      endPlanHour,
      endPlanMinute,
      payPlanYmd,
      create_dtm,
      delete_yn,
      ...rest
    }) => rest)(copyCargoItem);

    const serializedQuery = encodeURIComponent(
      JSON.stringify({ cargoOrder: paramData })
    );
    router.push({
      pathname: "/orders/create",
      query: { serializedQuery },
    });
  };

  //수기배차
  const handleDirectAlloc = (cargo_seq) => {
    const cargoItem = {
      ...cargoOrder.find((item) => item.cargo_seq === cargo_seq),
    };

    if (cargoItem) {
      setSelectedOrder(cargoItem);
      openAllocModal();
    }
  };

  const filteredCargoList = () => {
    return (cargoOrder || []).length > 0
      ? cargoOrder.filter((item) => {
          if (searchStatus === "ALL") {
            return true;
          } else if (searchStatus === "취소") {
            return item.delete_yn === "Y";
          } else {
            return item.ordStatus === searchStatus;
          }
        })
      : [];
  };

  const getCountByStatus = (status) => {
    return (cargoOrder || []).length > 0
      ? cargoOrder
          .filter((item) => {
            if (status === "ALL") {
              return true;
            } else if (status === "취소") {
              return item.delete_yn === "Y";
            } else {
              return item.ordStatus === status;
            }
          })
          .length.toString()
      : "0";
  };

  const handleSearchStatus = (status) => {
    setSearchStatus(status);
  };

  return (
    <div className="pt-16 pb-5 lg:p-3 relative">
      <Modal
        isOpen={isAllocModalOpen}
        onRequestClose={closeAllocModal}
        contentLabel="Modal"
        style={customModalStyles}
      >
        <DirectAllocModal
          paramObj={selectedOrder}
          onCancel={closeAllocModal}
          onComplete={callbackAllocModal}
        />
      </Modal>
      <div className="lg:border lg:border-gray-200 bg-white lg:p-5 lg:mt-2">
        <div className="bg-white fixed lg:static top-16 w-full z-40">
          <div className="grid grid-cols-5 items-center lg:hidden">
            <div
              className={
                "text-white text-center bg-mainColor2 border-b-8 shadow-inner transition-all duration-500" +
                (searchStatus == "ALL"
                  ? " border-mainColor4 font-extrabold"
                  : " border-mainColor2")
              }
              onClick={() => handleSearchStatus("ALL")}
            >
              <p className="py-3">전체</p>
              <button onClick={downloadExcel}>엑셀 다운로드</button>
            </div>
            <div
              className={
                "text-white text-center bg-mainColor2 border-b-8 shadow-inner transition-all duration-500" +
                (searchStatus == "화물접수"
                  ? " border-mainColor4 font-extrabold"
                  : " border-mainColor2")
              }
              onClick={() => handleSearchStatus("화물접수")}
            >
              <p className="py-3">접수중</p>
            </div>
            <div
              className={
                "text-white text-center bg-mainColor2 border-b-8 shadow-inner transition-all duration-500" +
                (searchStatus == "배차신청"
                  ? " border-mainColor4 font-extrabold"
                  : " border-mainColor2")
              }
              onClick={() => handleSearchStatus("배차신청")}
            >
              <p className="py-3">배차중</p>
            </div>
            <div
              className={
                "text-white text-center bg-mainColor2 border-b-8 shadow-inner transition-all duration-500" +
                (searchStatus == "배차완료"
                  ? " border-mainColor4 font-extrabold"
                  : " border-mainColor2")
              }
              onClick={() => handleSearchStatus("배차완료")}
            >
              <p className="py-3">배차완료</p>
            </div>
            <div
              className={
                "text-white text-center bg-mainColor2 border-b-8 shadow-inner transition-all duration-500" +
                (searchStatus == "취소"
                  ? " border-mainColor4 font-extrabold"
                  : " border-mainColor2")
              }
              onClick={() => handleSearchStatus("취소")}
            >
              <p className="py-3">취소</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-between w-full pb-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex justify-between gap-x-2 items-center">
                <div className="z-0">
                  <DateInput
                    dateValue={startSearchDt}
                    onDateChange={setStartSearchDt}
                    addClass="w-40"
                  />
                </div>
                <span>~</span>
                <div className="z-0">
                  <DateInput
                    dateValue={endSearchDt}
                    onDateChange={setEndSearchDt}
                    addClass="w-40"
                  />
                </div>
              </div>
              <div className="ml-3">
                <input
                  type="text"
                  placeholder="업체명 검색"
                  onKeyDown={handleCompanySearch}
                  {...companySearch}
                  className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                />
              </div>
              <div className="ml-1">
                <button
                  type="button"
                  onClick={() =>
                    (async () => {
                      await getOrderList();
                    })()
                  }
                  className="rounded-md bg-mainBlue px-3 py-3 text-sm lg:text-base font-semibold text-white shadow-sm"
                >
                  검색
                </button>
              </div>
            </div>
            <div className="grid grid-cols-5">
              <div
                className={
                  "text-sm w-full flex justify-between gap-x-3 px-5 py-2 bg-white border hover:shadow-md " +
                  (searchStatus == "ALL"
                    ? "bg-gray-100 border-mainBlue border-2 text-mainBlue"
                    : "text-gray-500 border-gray-200")
                }
                onClick={() => handleSearchStatus("ALL")}
              >
                <p className="text-sm">전체</p>
                <p className="text-right font-extrabold text-lg">
                  {getCountByStatus("ALL")}
                </p>
              </div>
              <div
                className={
                  "text-sm w-full flex justify-between gap-x-3 px-5 py-2 bg-white border hover:shadow-md " +
                  (searchStatus == "화물접수"
                    ? "bg-gray-100 border-mainBlue border-2 text-mainBlue"
                    : "text-gray-500 border-gray-200")
                }
                onClick={() => handleSearchStatus("화물접수")}
              >
                <p className="text-sm">접수중</p>
                <p className="text-right font-extrabold text-lg">
                  {getCountByStatus("화물접수")}
                </p>
              </div>
              <div
                className={
                  "text-sm w-full flex justify-between gap-x-3 px-5 py-2 bg-white border hover:shadow-md " +
                  (searchStatus == "배차신청"
                    ? "bg-gray-100 border-mainBlue border-2 text-mainBlue"
                    : "text-gray-500 border-gray-200")
                }
                onClick={() => handleSearchStatus("배차신청")}
              >
                <p className="text-sm">배차중</p>
                <p className="text-right font-extrabold text-lg">
                  {getCountByStatus("배차신청")}
                </p>
              </div>
              <div
                className={
                  "text-sm w-full flex justify-between gap-x-3 px-5 py-2 bg-white border hover:shadow-md " +
                  (searchStatus == "배차완료"
                    ? "bg-gray-100 border-mainBlue border-2 text-mainBlue"
                    : "text-gray-500 border-gray-200")
                }
                onClick={() => handleSearchStatus("배차완료")}
              >
                <p className="text-sm">배차완료</p>
                <p className="text-right font-extrabold text-lg">
                  {getCountByStatus("배차완료")}
                </p>
              </div>
              <div
                className={
                  "text-sm w-full flex justify-between gap-x-3 px-5 py-2 bg-white border hover:shadow-md " +
                  (searchStatus == "취소"
                    ? "bg-gray-100 border-mainBlue border-2 text-mainBlue"
                    : "text-gray-500 border-gray-200")
                }
                onClick={() => handleSearchStatus("취소")}
              >
                <p className="text-sm">취소</p>
                <p className="text-right font-extrabold text-lg">
                  {getCountByStatus("취소")}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-5 flex flex-col gap-y-3 border-b-2 lg:hidden">
          <div className="flex w-full justify-between items-center">
            <div className="z-0">
              <DateInput
                dateValue={startSearchDt}
                onDateChange={setStartSearchDt}
                addClass="w-40"
              />
            </div>
            <span>~</span>
            <div className="z-0">
              <DateInput
                dateValue={endSearchDt}
                onDateChange={setEndSearchDt}
                addClass="w-40"
              />
            </div>
          </div>
          <div className="">
            <input
              type="text"
              placeholder="업체명 검색"
              onKeyDown={handleCompanySearch}
              {...companySearch}
              className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            />
          </div>
          <p className="text-right">{`${filteredCargoList().length} 건`}</p>
        </div>

        {/* Grid header(PC) */}
        <div className="hidden lg:block mt-5 border-y border-gray-200 py-3 bg-headerColor2 gap-x-1">
          <div className="grid grid-cols-9 items-center text-center text-gray-200">
            <div className="col-span-2 border-r border-gray-700">
              <span>상차정보</span>
            </div>
            <div className="col-span-2 border-r border-gray-700">
              <span>하차정보</span>
            </div>
            <div className="col-span-2 border-r border-gray-700">
              <span>화물내용</span>
            </div>
            <div className="border-r border-gray-700">
              <span>상태</span>
            </div>
            <div className="border-r border-gray-700">
              <span>{"화물복사" + (isAdmin ? " / 배차" : "")}</span>
            </div>
            <div className="">
              <span>등록일자</span>
            </div>
          </div>
        </div>

        <ul className="mt-5 pb-14 lg:pb-0 lg:mt-0 lg:h-rate7 lg:overflow-auto lg:border-b lg:border-gray-50">
          {filteredCargoList().length > 0 ? (
            filteredCargoList().map((item) => {
              const {
                cargo_seq,
                ordNo,
                startWide, //상차지 시/도
                startSgg, //상차지 구/군
                startDong, //상차지 읍/면/동
                startDetail,
                endWide, //하차지 시/도
                endSgg, //하차지 구/군
                endDong, //하차지 읍/면/동
                endDetail,
                multiCargoGub, //혼적여부("혼적")
                urgent, //긴급여부("긴급")
                shuttleCargoInfo, //왕복여부("왕복")
                truckType, //차량종류
                cargoTon,
                startPlanDt, //상차일("YYYYMMDD")
                startPlanHour,
                startPlanMinute,
                endPlanDt, //하차일("YYYYMMDD")
                endPlanHour,
                endPlanMinute,
                cargoDsc, //화물상세내용
                ordStatus, //화물상태(접수,완료등)
                startCompanyName,
                startAreaPhone,
                endCompanyName,
                endAreaPhone,
                fareView,
                create_dtm, //등록일시
                cjName, //차주명
                cjPhone, //차주연락처
              } = item;
              return (
                <li
                  className="flex flex-col px-5 mb-5 lg:px-0 lg:mb-0 lg:hover:bg-gray-100"
                  key={cargo_seq}
                  onClick={() => handleDetail(cargo_seq)}
                >
                  <div className="flex flex-col justify-between bg-white rounded-2xl shadow-md border border-gray-100 lg:hidden">
                    <div className="p-5 flex justify-between">
                      <div className="flex flex-col gap-y-3">
                        <div className="flex gap-x-2 items-center">
                          <p className="bg-buttonPink rounded-lg text-white font-bold p-1 min-w-fit text-xs">
                            출발
                          </p>
                          <p className="truncate leading-5 text-gray-600 whitespace-pre-wrap">
                            {`${startWide} ${startSgg} ${startDong} ${startDetail}`}
                          </p>
                        </div>
                        <div className="flex gap-x-2 items-center">
                          <p className="bg-mainColor3 rounded-lg text-white font-bold p-1 min-w-fit text-xs">
                            도착
                          </p>
                          <p className="truncate leading-5 text-gray-600 whitespace-pre-wrap">
                            {`${endWide} ${endSgg} ${endDong} ${endDetail}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 bg-gray-50 rounded-b-xl flex flex-col gap-y-4">
                      <div className="grid grid-cols-2 items-center">
                        <div className="flex flex-col items-start gap-y-1">
                          <span className="text-sm text-gray-400">
                            오더번호
                          </span>
                          <span className="text-gray-600">{ordNo || "-"}</span>
                        </div>
                        <div
                          className="text-sm font-semibold w-fit flex items-center text-white bg-buttonSilver rounded-md py-1 px-3 hover:cursor-pointer hover:shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCargoCopy(cargo_seq);
                          }}
                        >
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
                              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                            />
                          </svg>
                          <p>복사</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="flex flex-col items-start gap-y-1">
                          <span className="text-sm text-gray-400">
                            운송수단
                          </span>
                          <span className="text-gray-600">{truckType}</span>
                        </div>
                        <div className="flex flex-col items-start gap-y-1">
                          <span className="text-sm text-gray-400">
                            운송상태
                          </span>
                          <span className="text-gray-600">
                            {ordStatus == "화물접수"
                              ? "접수중"
                              : ordStatus == "배차신청"
                              ? "배차중"
                              : ordStatus}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="flex flex-col items-start gap-y-1">
                          <span className="text-sm text-gray-400">
                            운송일시
                          </span>
                          <span className="text-gray-600">
                            {formatDate(startPlanDt)}
                            {` (${startPlanHour || "00"}:${
                              startPlanMinute || "00"
                            })`}
                          </span>
                        </div>
                        <div className="flex flex-col items-start gap-y-1">
                          <span className="text-sm text-gray-400">
                            운송비용
                          </span>
                          <span className="text-gray-600">{`${
                            fareView == "0" ? "-" : addCommas(fareView)
                          }`}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="flex flex-col items-start gap-y-1">
                          <span className="text-sm text-gray-400">
                            차량종류
                          </span>
                          <span className="text-gray-600">{truckType}</span>
                        </div>
                        <div className="flex flex-col items-start gap-y-1">
                          <span className="text-sm text-gray-400">
                            차량톤수
                          </span>
                          <span className="text-gray-600">{cargoTon}</span>
                        </div>
                      </div>
                      {ordStatus == "배차완료" && (
                        <div className="grid grid-cols-2">
                          <div className="flex flex-col items-start gap-y-1">
                            <span className="text-sm text-gray-400">차주</span>
                            <span className="text-gray-600">{cjName}</span>
                          </div>
                          <div className="flex flex-col items-start gap-y-1">
                            <span className="text-sm text-gray-400">
                              연락처
                            </span>
                            <span className="text-gray-600">{cjPhone}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="hidden lg:block border-b border-gray-200 py-3">
                    <div className="grid grid-cols-9 items-center">
                      <div className="col-span-2 px-5">
                        <p className="mt-1 truncate leading-5 font-bold text-gray-500">
                          {`${startCompanyName || ""} ${
                            formatPhoneNumber(startAreaPhone) || ""
                          }`}
                        </p>
                        <p className="mt-1 truncate leading-5 text-gray-500 whitespace-pre-wrap">
                          {`${startWide} ${startSgg} ${startDong} ${startDetail}`}
                        </p>
                        <p className="mt-1 truncate leading-5 text-gray-500">
                          {formatDate(startPlanDt)}
                        </p>
                      </div>
                      <div className="col-span-2 px-5">
                        <p className="mt-1 truncate leading-5 font-bold text-gray-500">
                          {`${endCompanyName || ""} ${
                            formatPhoneNumber(endAreaPhone) || ""
                          }`}
                        </p>
                        <p className="mt-1 truncate leading-5 text-gray-500 whitespace-pre-wrap">
                          {`${endWide} ${endSgg} ${endDong} ${endDetail}`}
                        </p>
                        <p className="mt-1 truncate leading-5 text-gray-500">
                          {formatDate(endPlanDt)}
                        </p>
                      </div>
                      <div className="flex flex-col col-span-2 px-5">
                        <p className="text-sm font-semibold leading-6 text-gray-500">
                          {cargoDsc}
                        </p>
                        <div className="flex items-center gap-x-3">
                          <p className="px-2 py-0.5 rounded-md shadow-md bg-gray-500 text-sm text-white">
                            {`${cargoTon}t ${truckType}`}
                          </p>
                          {urgent && (
                            <p className="px-2 py-0.5 rounded-md shadow-md bg-red-400 text-sm text-white">
                              {urgent}
                            </p>
                          )}
                          {multiCargoGub && (
                            <p className="px-2 py-0.5 rounded-md shadow-md bg-indigo-400 text-sm text-white">
                              {multiCargoGub}
                            </p>
                          )}
                          {shuttleCargoInfo && (
                            <p className="px-2 py-0.5 rounded-md bg-yellow-400 text-sm text-white">
                              {shuttleCargoInfo}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-center flex flex-col items-center">
                        <span
                          className={
                            "text-sm text-white font-bold px-3 py-2 rounded-full " +
                            (ordStatus == "화물접수"
                              ? "bg-indigo-400 ring-indigo-400"
                              : ordStatus == "배차신청"
                              ? "bg-orange-400 ring-orange-400"
                              : ordStatus == "배차완료"
                              ? "bg-purple-400 ring-bg-purple-400"
                              : ordStatus == "배차취소"
                              ? "bg-slate-400 ring-bg-slate-400"
                              : "bg-zinc-400 ring-zinc-400")
                          }
                        >
                          {ordStatus == "화물접수"
                            ? "접수중"
                            : ordStatus == "배차신청"
                            ? "배차중"
                            : ordStatus}
                        </span>
                        {ordStatus == "배차완료" && (
                          <div className="w-full mt-2 px-5 flex flex-col items-baseline text-sm text-slate-500">
                            <span className="text-left">{`(차주) ${cjName}`}</span>
                            <span className="text-left">{`${cjPhone}`}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-y-2 justify-center px-5">
                        <div
                          className="text-sm font-semibold flex items-center gap-x-3 w-fit text-slate-500 border border-slate-500 rounded-md py-1 px-3 hover:cursor-pointer hover:shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCargoCopy(cargo_seq);
                          }}
                        >
                          <p>복사</p>
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
                              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                            />
                          </svg>
                        </div>
                        {isAdmin && (
                          <div
                            className="text-sm font-semibold flex items-center gap-x-3 w-fit text-slate-500 border border-slate-500 rounded-md py-1 px-3 hover:cursor-pointer hover:shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectAlloc(cargo_seq);
                            }}
                          >
                            <p>배차</p>
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
                                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500 px-5">
                        <p>{create_dtm}</p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <div className="bg-gray-100 p-24 w-full h-full my-auto text-center text-gray-400 flex items-center justify-center">
              <p>배차 내역이 없습니다.</p>
            </div>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CargoList;
