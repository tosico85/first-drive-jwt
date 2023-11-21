import { useContext, useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import AuthContext from "../context/authContext";
import { useRouter } from "next/router";
import Modal from "react-modal";
import {
  addCommas,
  formatDate,
  getOneWeekAgoDate,
  getPeriodDate,
  getTodayDate,
} from "../../utils/StringUtils";
import { formatPhoneNumber } from "../../utils/StringUtils";
import DateInput from "../components/custom/DateInput";
import { useInput } from "../../hooks/useInput";
import DirectAllocModal from "../components/modals/DirectAllocModal";
import ExcelJS from "exceljs";
import ComboBox from "../components/custom/ComboBox";
import ModifyAddFareModal from "../components/modals/ModifyAddFareModal";

const CargoList = () => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const [cargoOrder, setCargoOrder] = useState([]);
  const [searchStatus, setSearchStatus] = useState("ALL");
  const [startSearchDt, setStartSearchDt] = useState(getOneWeekAgoDate());
  const [endSearchDt, setEndSearchDt] = useState(getTodayDate());
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [isAddFareModalOpen, setIsAddFareModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState(-1);
  //const [companySearch, setCompanySearch] = useState("");
  const companySearch = useInput("");
  const router = useRouter();

  const isAdmin = userInfo.auth_code === "ADMIN";
  const selectPeriodList = [
    { name: "오늘", value: 1 },
    { name: "어제", value: 2 },
    { name: "이번주", value: 3 },
    { name: "최근한주", value: 4 },
    { name: "지난주", value: 5 },
    { name: "이번달", value: 6 },
    { name: "최근한달", value: 7 },
    { name: "지난달", value: 8 },
  ];

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Cargo Orders");

      // 엑셀 헤더 추가
      const headerRow = worksheet.addRow([
        "주문 번호",
        "상차지",
        "하차지",
        //"혼적여부",
        //"긴급여부",
        "왕복여부",
        "차량종류",
        //"화물량",
        "상차일",
        "하차일",
        "화물상태",
        "등록일시",
        "차주명",
        "차주연락처",
        "운임료",
        isAdmin ? "운임료(관리자용)" : "",
      ]);
      headerRow.font = { bold: true };

      // 엑셀 칸 너비 조정
      worksheet.columns = [
        { width: 10 }, // 주문 번호
        { width: 20 }, // 상차지
        { width: 20 }, // 하차지
        //{ width: 10 }, // 혼적여부
        //{ width: 10 }, // 긴급여부
        { width: 10 }, // 왕복여부
        { width: 25 }, // 차량종류
        //{ width: 10 }, // 화물량
        { width: 20 }, // 상차일
        { width: 20 }, // 하차일
        { width: 15 }, // 화물상태
        { width: 20 }, // 등록일시
        { width: 15 }, // 차주명
        { width: 15 }, // 차주연락처
        { width: 15 }, // 운임료
        isAdmin ? { width: 15 } : 0, // 관리자용 운임료
      ];

      // 테두리 스타일 설정 함수
      const setBorderStyle = (cell, style) => {
        cell.border = {
          top: style,
          bottom: style,
          left: style,
          right: style,
        };
      };

      // 데이터가 있는 헤더 셀에 배경색과 테두리 스타일 적용
      headerRow.eachCell((cell, colNumber) => {
        if (colNumber <= (isAdmin ? 16 : 15)) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFF00" }, // 노란색 배경
          };
          setBorderStyle(cell, { style: "thin" });
        }
      });

      // 필터링된 데이터 가져오기
      const filteredData = filteredCargoList();

      filteredData.forEach((item, index) => {
        // 엑셀 행 추가
        const row = worksheet.addRow([
          item.ordNo,
          `${item.startWide} ${item.startSgg} ${item.startDong}`,
          `${item.endWide} ${item.endSgg} ${item.endDong}`,
          //item.multiCargoGub,
          //item.urgent,
          item.shuttleCargoInfo,
          `${item.cargoTon}톤 ${item.truckType}`,
          //item.cargoTon,
          `${item.startPlanDt} ${item.startPlanHour}:${item.startPlanMinute}`,
          `${item.endPlanDt} ${item.endPlanHour}:${item.endPlanMinute}`,
          item.ordStatus,
          item.create_dtm,
          item.cjName,
          item.cjPhone,
          item.fareView,
          isAdmin ? item.fare : "",
        ]);

        // 각 셀에 테두리 스타일 적용
        for (let colNumber = 1; colNumber <= 15; colNumber++) {
          setBorderStyle(row.getCell(colNumber), { style: "thin" });
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cargo_orders.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportClick = () => {
    exportToExcel();
  };

  const handlePeriodChange = (value) => {
    const period = getPeriodDate(value);
    setStartSearchDt(period.startDate);
    setEndSearchDt(period.endDate);

    setSelectedPeriod(value);
    return;
  };

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

  const openAddFareModal = () => {
    setIsAddFareModalOpen(true);
  };

  const closeAddFareModal = () => {
    setIsAddFareModalOpen(false);
  };

  const callbackAddFareModal = () => {
    closeAddFareModal();
    (async () => {
      await getOrderList();
    })();
  };

  const customModalStyles = {
    content: {
      top: "50%",
      left: "50%",
      width: "860px",
      height: "500px",
      borderRadius: "10px",
      transform: "translate(-50%, -50%)",
      boxShadow: "0px 0px 10px #e2e2e2",
    },
  };

  //추가요금 수정 모달 스타일
  const customModalStyles_addFare = {
    content: {
      ...customModalStyles.content,
      width: "460px",
      height: "300px",
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
      cjName,
      cjPhone,
      cjCarNum,
      cjCargoTon,
      cjTruckType,
      fare,
      fareView,
      addFare,
      addFareReason,
      group_name,
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

  //추가요금 수정
  const handleAddFare = (cargo_seq) => {
    //if (!isAdmin) return;

    const cargoItem = {
      ...cargoOrder.find((item) => item.cargo_seq === cargo_seq),
    };

    if (cargoItem) {
      setSelectedOrder(cargoItem);
      openAddFareModal();
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

  function getStatusColorClass(ordStatus) {
    if (ordStatus === "화물접수") {
      return "bg-pastelBlue text-white border-pastelBlue"; // 파스텔 블루
    } else if (ordStatus === "배차신청") {
      return "bg-pastelYellow text-white border-pastelYellow"; // 파스텔 옐로우
    } else if (ordStatus === "배차완료") {
      return "bg-pastelGreen text-white border-pastelGreen"; // 파스텔 그린
    } else if (ordStatus === "화물취소") {
      return "bg-pastelRed text-white border-pastelRed"; // 파스텔 레드
    } else {
      return "bg-gray-200 text-gray-600 border-gray-300"; // 기본 파스텔 그레이
    }
  }

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
      <Modal
        isOpen={isAddFareModalOpen}
        onRequestClose={closeAddFareModal}
        contentLabel="Modal"
        style={customModalStyles_addFare}
      >
        <ModifyAddFareModal
          paramObj={selectedOrder}
          onCancel={closeAddFareModal}
          onComplete={callbackAddFareModal}
        />
      </Modal>
      <div className="lg:border lg:border-gray-200 bg-white lg:p-5 lg:mt-2">
        <div className="bg-white fixed lg:static top-16 w-full z-40">
          <div className="grid grid-cols-5 items-center lg:hidden font-NotoSansKRMedium">
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
                <div>
                  <ComboBox
                    onComboChange={handlePeriodChange}
                    list={selectPeriodList}
                    selectedValue={selectedPeriod}
                    title={"기간입력"}
                  />
                </div>
                <div className="z-0">
                  <DateInput
                    dateValue={startSearchDt}
                    onDateChange={setStartSearchDt}
                    disabled={selectedPeriod != -1}
                    addClass="w-32"
                  />
                </div>
                <span>~</span>
                <div className="z-0">
                  <DateInput
                    dateValue={endSearchDt}
                    onDateChange={setEndSearchDt}
                    disabled={selectedPeriod != -1}
                    addClass="w-32"
                  />
                </div>
              </div>
              {isAdmin && (
                <div className="ml-3">
                  <input
                    type="text"
                    placeholder="업체명 검색"
                    onKeyDown={handleCompanySearch}
                    {...companySearch}
                    className="block w-full rounded-sm border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  />
                </div>
              )}

              {isAdmin && (
                <div className="ml-1">
                  <button
                    type="button"
                    onClick={async () => {
                      await getOrderList();
                    }}
                    className="rounded-md bg-mainBlue px-5 py-3 text-sm lg:text-base font-semibold text-white shadow-sm cursor-pointer"
                  >
                    검색
                  </button>
                </div>
              )}

              <div className="ml-3">
                {" "}
                {/* 좌측 여백을 ml-3으로 수정 */}
                <button
                  onClick={handleExportClick}
                  className="rounded-md bg-mainBlue px-5 py-3 text-sm lg:text-base font-semibold text-white shadow-sm cursor-pointer"
                >
                  엑셀
                </button>
              </div>

              <div className="ml-1"></div>
            </div>
            <div className="grid grid-cols-5">
              <div
                className={
                  "relative text-sm w-full flex justify-between gap-x-3 px-5 py-3 bg-white border hover:shadow-md " +
                  (searchStatus === "ALL"
                    ? "bg-gray-100 border-mainBlue border-2 text-mainBlue"
                    : "text-gray-500 border-gray-200")
                }
                onClick={() => handleSearchStatus("ALL")}
              >
                <div className="flex items-center">
                  <p className="text-sm">전체</p>
                </div>
                <div className="flex items-center">
                  <p className="text-right font-extrabold text-lg">
                    {getCountByStatus("ALL")}
                  </p>
                </div>
              </div>
              <div
                className={
                  "relative text-sm w-full flex justify-between gap-x-3 px-5 py-3 bg-white border hover:shadow-md " +
                  (searchStatus == "화물접수"
                    ? "bg-gray-100 border-mainBlue border-2 text-mainBlue"
                    : "text-gray-500 border-gray-200")
                }
                onClick={() => handleSearchStatus("화물접수")}
              >
                <div className="flex items-center">
                  <p className="text-sm">접수중</p>
                </div>
                <div className="flex items-center">
                  <p className="text-right font-extrabold text-lg">
                    {getCountByStatus("화물접수")}
                  </p>
                </div>
              </div>
              <div
                className={
                  "relative text-sm w-full flex justify-between gap-x-3 px-5 py-3 bg-white border hover:shadow-md " +
                  (searchStatus == "배차신청"
                    ? "bg-gray-100 border-mainBlue border-2 text-mainBlue"
                    : "text-gray-500 border-gray-200")
                }
                onClick={() => handleSearchStatus("배차신청")}
              >
                <div className="flex items-center">
                  <p className="text-sm">배차중</p>
                </div>
                <div className="flex items-center">
                  <p className="text-right font-extrabold text-lg">
                    {getCountByStatus("배차신청")}
                  </p>
                </div>
              </div>
              <div
                className={
                  "relative text-sm w-full flex justify-between gap-x-3 px-5 py-3 bg-white border hover:shadow-md " +
                  (searchStatus == "배차완료"
                    ? "bg-gray-100 border-mainBlue border-2 text-mainBlue"
                    : "text-gray-500 border-gray-200")
                }
                onClick={() => handleSearchStatus("배차완료")}
              >
                <div className="flex items-center">
                  <p className="text-sm">배차완료</p>
                </div>
                <div className="flex items-center">
                  <p className="text-right font-extrabold text-lg">
                    {getCountByStatus("배차완료")}
                  </p>
                </div>
              </div>
              <div
                className={
                  "relative text-sm w-full flex justify-between gap-x-3 px-5 py-3 bg-white border hover:shadow-md " +
                  (searchStatus == "취소"
                    ? "bg-gray-100 border-mainBlue border-2 text-mainBlue"
                    : "text-gray-500 border-gray-200")
                }
                onClick={() => handleSearchStatus("취소")}
              >
                <div className="flex items-center">
                  <p className="text-sm">취소</p>
                </div>
                <div className="flex items-center">
                  <p className="text-right font-extrabold text-lg">
                    {getCountByStatus("취소")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-subBgColor4 p-5 flex flex-col gap-y-3 border-b-3 lg:hidden font-NotoSansKRMedium">
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
          {isAdmin && (
            <div className="">
              <input
                type="text"
                placeholder="업체명 검색"
                onKeyDown={handleCompanySearch}
                {...companySearch}
                className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
              />
            </div>
          )}
          <p className="text-right">{`${filteredCargoList().length} 건`}</p>
        </div>

        {/* Grid header(PC) */}
        <div className="hidden lg:block mt-5 border-y border-gray-200 py-3 bg-headerColor2 gap-x-1 font-NotoMedium">
          <div className="grid grid-cols-11 items-center text-center text-gray-200">
            <div className="border-r border-gray-700">
              <span>그룹명</span>
            </div>
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
              <span>차량정보</span>
            </div>
            <div className="border-r border-gray-700">
              <span>상태</span>
            </div>
            <div className="border-r border-gray-700">
              <span>{isAdmin ? "복사 / 배차" : "화물복사"}</span>
            </div>
            <div className="">
              <span>등록일자</span>
            </div>
          </div>
        </div>

        <ul className="mt-5 pb-14 lg:pb-0 lg:mt-0 lg:h-rate7 lg:overflow-auto lg:border-b lg:border-gray-50 font-NotoSansKRMedium">
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
                cjCarNum,
                cjTruckType,
                cjCargoTon,
                fare,
                addFare,
                addFareReason,
                group_name,
                create_user,
                userName,
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
                          <p className="truncate leading-5 text-gray-600 whitespace-pre-wrap ">
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
                    <div className="p-5 bg-subBgColor4 rounded-b-xl flex flex-col gap-y-4">
                      {isAdmin && (
                        <div className="grid grid-cols-2 items-center">
                          <div className="flex flex-col items-start gap-y-1">
                            <span className="text-sm text-gray-400">
                              그룹명
                            </span>
                            <span className="text-gray-600">
                              {group_name || "-"}
                            </span>
                          </div>
                          <div className="flex flex-col items-start gap-y-1">
                            <span className="text-sm text-gray-400">
                              부서명
                            </span>
                            <span className="text-gray-600">
                              {userName || "-"}
                            </span>
                          </div>
                        </div>
                      )}
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
                          <div
                            className={`rounded-lg shadow-lg p-3 ${getStatusColorClass(
                              ordStatus
                            )}`}
                            style={{
                              width: "75px",
                              height: "32px",
                              fontSize: "13px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              letterSpacing: "1px",
                            }}
                          >
                            {ordStatus === "화물접수"
                              ? "접수중"
                              : ordStatus === "배차신청"
                              ? "배차중"
                              : ordStatus === "배차완료" // 추가: "배차완료" 처리
                              ? "완료"
                              : ordStatus === "화물취소" // 추가: "배차완료" 처리
                              ? "취소"
                              : ordStatus}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2">
                        <div className="flex flex-col items-start gap-y-1">
                          <span className="text-sm text-gray-400">
                            상차일시
                          </span>
                          <span className="text-gray-600">
                            {formatDate(startPlanDt)}
                            {` (${startPlanHour || "00"}:${
                              startPlanMinute || "00"
                            })`}
                          </span>
                          <span className="text-sm text-gray-400">
                            하차일시
                          </span>
                          <span className="text-gray-600">
                            {formatDate(endPlanDt)}
                            {` (${endPlanHour || "00"}:${
                              endPlanMinute || "00"
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
                          <span className="text-gray-600">{cargoTon}톤</span>
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

                  <div className="hidden lg:block border-b border-gray-200 py-3 font-NotoSansKRThin font-bold">
                    <div className="grid grid-cols-11 items-center">
                      <div className="px-5">
                        {isAdmin ? (
                          <>
                            <p>{group_name}</p>
                            <p className="text-blue-600 font-bold">
                              {userName}
                            </p>
                          </>
                        ) : (
                          <p>{group_name}</p>
                        )}
                      </div>
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
                          {`${formatDate(
                            startPlanDt
                          )} ${startPlanHour}:${startPlanMinute}`}
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
                          {`${formatDate(
                            endPlanDt
                          )} ${endPlanHour}:${endPlanMinute}`}
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
                        {ordStatus == "배차완료" && (
                          <div className="w-full mt-2 flex flex-col items-baseline text-base text-slate-500">
                            <span className="text-left">{`${cjName}`}</span>
                            <span className="text-left">{`${formatPhoneNumber(
                              cjPhone
                            )}`}</span>
                            <span className="text-left">{`${cjCarNum}`}</span>
                            <span className="text-left">{`${cjTruckType}`}</span>
                            <span className="text-left">{`${cjCargoTon}`}</span>
                          </div>
                        )}
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
                          <div
                            className={
                              "text-sm text-white font-bold px-3 py-2 rounded-full mt-3 cursor-pointer" +
                              (addFare != "0"
                                ? " bg-red-400 ring-bg-red-400"
                                : " bg-slate-400 ring-bg-slate-400")
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddFare(cargo_seq);
                            }}
                          >
                            <p className="shrink-0">추가요금</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-y-2 justify-center px-3">
                        <div
                          className="text-sm font-semibold flex items-center justify-center gap-x-3 w-full text-slate-500 border border-slate-500 rounded-md py-1 px-3 hover:cursor-pointer hover:shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCargoCopy(cargo_seq);
                          }}
                        >
                          <p className="shrink-0">복사</p>
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
                        {isAdmin /* && ordStatus == "화물접수" */ && (
                          <div
                            className="text-sm font-semibold flex items-center justify-center gap-x-3 w-full text-slate-500 border border-slate-500 rounded-md py-1 px-3 hover:cursor-pointer hover:shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectAlloc(cargo_seq);
                            }}
                          >
                            <p className="shrink-0">배차</p>
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
                      <div className="text-right text-base text-gray-500 px-5">
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
