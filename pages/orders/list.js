import { useContext, useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import AuthContext from "../context/authContext";
import { useRouter } from "next/router";
import {
  addCommas,
  formatDate,
  getOneWeekAgoDate,
  getTodayDate,
} from "../../utils/StringUtils";
import { formatPhoneNumber } from "../../utils/StringUtils";
import DateInput from "../components/custom/DateInput";

const CargoList = () => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const [cargoOrder, setCargoOrder] = useState([]);
  const [searchStatus, setSearchStatus] = useState("ALL");
  const [startSearchDt, setStartSearchDt] = useState(getOneWeekAgoDate());
  const [endSearchDt, setEndSearchDt] = useState(getTodayDate());
  const [companySearch, setCompanySearch] = useState("");
  const router = useRouter();

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
      company_nm: companySearch,
    };

    const result = await requestServer(url, params);
    setCargoOrder(() => result);
    //console.log("Cargo order >>", cargoOrder);
  };

  useEffect(() => {
    (async () => {
      await getOrderList();
    })();
  }, [userInfo, startSearchDt, endSearchDt, companySearch]);

  const handleCompanySearch = (e) => {
    const {
      key,
      target: { value },
    } = e;

    if (key == "Enter") {
      setCompanySearch(value);
    }
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
    const paramData = (({ cargo_seq, create_dtm, ...rest }) => rest)(
      copyCargoItem
    );

    const serializedQuery = encodeURIComponent(
      JSON.stringify({ cargoOrder: paramData })
    );
    router.push({
      pathname: "/orders/create",
      query: { serializedQuery },
    });
  };

  const handleSearchStatus = (status) => {
    setSearchStatus(status);
  };

  return (
    <div className="pb-5 bg-white relative">
      <div className="bg-white fixed top-16 w-full z-40">
        <div className="grid grid-cols-5 items-center sm:hidden">
          <div
            className={
              "text-white text-center bg-midnightGreen border-b-8 shadow-inner" +
              (searchStatus == "ALL"
                ? " border-tiffanyBlue font-extrabold"
                : " border-midnightGreen")
            }
            onClick={() => handleSearchStatus("ALL")}
          >
            <p className="py-3">전체</p>
          </div>
          <div
            className={
              "text-white text-center bg-midnightGreen border-b-8 shadow-inner" +
              (searchStatus == "화물접수"
                ? " border-tiffanyBlue font-extrabold"
                : " border-midnightGreen")
            }
            onClick={() => handleSearchStatus("화물접수")}
          >
            <p className="py-3">화물접수</p>
          </div>
          <div
            className={
              "text-white text-center bg-midnightGreen border-b-8 shadow-inner" +
              (searchStatus == "배차신청"
                ? " border-tiffanyBlue font-extrabold"
                : " border-midnightGreen")
            }
            onClick={() => handleSearchStatus("배차신청")}
          >
            <p className="py-3">배차신청</p>
          </div>
          <div
            className={
              "text-white text-center bg-midnightGreen border-b-8 shadow-inner" +
              (searchStatus == "배차완료"
                ? " border-tiffanyBlue font-extrabold"
                : " border-midnightGreen")
            }
            onClick={() => handleSearchStatus("배차완료")}
          >
            <p className="py-3">배차완료</p>
          </div>
          <div
            className={
              "text-white text-center bg-midnightGreen border-b-8 shadow-inner" +
              (searchStatus == "취소"
                ? " border-tiffanyBlue font-extrabold"
                : " border-midnightGreen")
            }
            onClick={() => handleSearchStatus("취소")}
          >
            <p className="py-3">취소</p>
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-2 mt-5 gap-y-3 py-5">
          <div className="flex justify-start gap-x-3">
            <div
              className={
                "text-sm w-fit h-fit font-bold px-2 py-1 rounded-full border border-gray-400 hover:shadow-md " +
                (searchStatus == "ALL"
                  ? "bg-gray-400 text-white"
                  : "text-gray-400")
              }
              onClick={() => handleSearchStatus("ALL")}
            >
              전체
            </div>
            <div
              className={
                "text-sm w-fit h-fit font-bold px-2 py-1 rounded-full border border-gray-400 hover:shadow-md " +
                (searchStatus == "화물접수"
                  ? "bg-gray-400 text-white"
                  : "text-gray-400")
              }
              onClick={() => handleSearchStatus("화물접수")}
            >
              화물접수
            </div>
            <div
              className={
                "text-sm w-fit h-fit font-bold px-2 py-1 rounded-full border border-gray-400 hover:shadow-md " +
                (searchStatus == "배차신청"
                  ? "bg-gray-400 text-white"
                  : "text-gray-400")
              }
              onClick={() => handleSearchStatus("배차신청")}
            >
              배차신청
            </div>
            <div
              className={
                "text-sm w-fit h-fit font-bold px-2 py-1 rounded-full border border-gray-400 hover:shadow-md " +
                (searchStatus == "배차완료"
                  ? "bg-gray-400 text-white"
                  : "text-gray-400")
              }
              onClick={() => handleSearchStatus("배차완료")}
            >
              배차완료
            </div>
            <div
              className={
                "text-sm w-fit h-fit font-bold px-2 py-1 rounded-full border border-gray-400 hover:shadow-md " +
                (searchStatus == "취소"
                  ? "bg-gray-400 text-white"
                  : "text-gray-400")
              }
              onClick={() => handleSearchStatus("취소")}
            >
              취소
            </div>
          </div>
          <p className="text-right">{`${
            cargoOrder.length > 0
              ? cargoOrder.filter((item) => {
                  if (searchStatus === "ALL") {
                    return true;
                  } else if (searchStatus === "취소") {
                    return item.delete_yn === "Y";
                  } else {
                    return item.ordStatus === searchStatus;
                  }
                }).length
              : "0"
          } 건`}</p>
        </div>
      </div>
      <div className="bg-gray-50 p-5 flex flex-col gap-y-3 border-b-2 sm:hidden">
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
            className="block w-full rounded-md border-0 px-2 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
        </div>
        <p className="text-right">{`${
          cargoOrder.length > 0
            ? cargoOrder.filter((item) => {
                if (searchStatus === "ALL") {
                  return true;
                } else if (searchStatus === "취소") {
                  return item.delete_yn === "Y";
                } else {
                  return item.ordStatus === searchStatus;
                }
              }).length
            : "0"
        } 건`}</p>
      </div>

      <ul className="mt-5 sm:mt-16 pb-14">
        {cargoOrder.length > 0 &&
          cargoOrder
            .filter((item) => {
              if (searchStatus === "ALL") {
                return true;
              } else if (searchStatus === "취소") {
                return item.delete_yn === "Y";
              } else {
                return item.ordStatus === searchStatus;
              }
            })
            .map((item) => {
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
              } = item;
              return (
                <li
                  className="flex flex-col px-5 mb-5"
                  key={cargo_seq}
                  onClick={() => handleDetail(cargo_seq)}
                >
                  <div className="flex flex-col justify-between bg-white rounded-2xl shadow-md border border-gray-100 sm:hidden">
                    <div className="p-5 flex justify-between">
                      <div className="flex flex-col gap-y-3">
                        <div className="flex gap-x-2 items-center">
                          <p className="bg-gray-400 rounded-lg text-white font-bold p-1 min-w-fit text-xs">
                            출발
                          </p>
                          <p className="truncate leading-5 text-gray-600 whitespace-pre-wrap">
                            {`${startWide} ${startSgg} ${startDong} ${startDetail}`}
                          </p>
                        </div>
                        <div className="flex gap-x-2 items-center">
                          <p className="bg-gray-400 rounded-lg text-white font-bold p-1 min-w-fit text-xs">
                            도착
                          </p>
                          <p className="truncate leading-5 text-gray-600 whitespace-pre-wrap">
                            {`${endWide} ${endSgg} ${endDong} ${endDetail}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 bg-gray-100 rounded-b-xl flex flex-col gap-y-4">
                      <div className="grid grid-cols-2 items-center">
                        <div className="flex flex-col items-start gap-y-1">
                          <span className="text-sm text-gray-400">
                            오더번호
                          </span>
                          <span className="text-gray-600">{ordNo || "-"}</span>
                        </div>
                        <div
                          className="text-sm font-semibold w-fit flex items-center text-slate-500 border border-slate-500 rounded-md py-1 px-2 hover:cursor-pointer hover:shadow-md"
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
                          <span className="text-gray-600">{ordStatus}</span>
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
                      <div></div>
                    </div>
                    <div className="flex flex-col gap-x-1 w-full justify-between hidden">
                      <div className="flex flex-col w-full">
                        <div className="flex flex-col items-start gap-y-2 w-full gap-x-5 mb-2">
                          <div className="w-full flex items-center justify-between">
                            <p className="flex items-center gap-x-3 text-sm font-semibold leading-6 text-gray-500">
                              {cargoDsc}
                            </p>
                            <div
                              className="text-sm font-semibold flex items-center text-slate-500 border border-slate-500 rounded-md py-1 px-2 hover:cursor-pointer hover:shadow-md"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCargoCopy(cargo_seq);
                              }}
                            >
                              <p>화물복사</p>
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
                          </div>
                          <div className="flex items-center gap-x-3">
                            <p className="px-2 py-0 rounded-md flex items-center h-5 shadow-md bg-gray-500 text-xs text-white">
                              {truckType}
                            </p>
                            {urgent && (
                              <p className="px-1 py-0 rounded-md flex items-center h-5 shadow-md bg-red-400 text-xs text-white">
                                {urgent}
                              </p>
                            )}
                            {multiCargoGub && (
                              <p className="px-1 py-0 rounded-md flex items-center h-5 shadow-md bg-indigo-400 text-xs text-white">
                                {multiCargoGub}
                              </p>
                            )}
                            {shuttleCargoInfo && (
                              <p className="px-1 py-0 rounded-md flex items-center h-5 bg-yellow-400 text-xs text-white">
                                {shuttleCargoInfo}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex text-xs gap-x-4 items-center">
                          <div>
                            <p className="mt-1 truncate leading-5 font-bold text-gray-500">
                              {`${startCompanyName || ""} ${
                                formatPhoneNumber(startAreaPhone) || ""
                              }`}
                            </p>
                            <p className="mt-1 truncate leading-5 text-gray-500">
                              {`${startWide} ${startSgg} ${startDong} ${startDetail}`}
                            </p>
                            <p className="mt-1 truncate leading-5 text-gray-500">
                              {formatDate(startPlanDt)}
                            </p>
                          </div>
                          <div className="text-gray-500">
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
                                d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="mt-1 truncate leading-5 font-bold text-gray-500">
                              {`${endCompanyName || ""} ${
                                formatPhoneNumber(endAreaPhone) || ""
                              }`}
                            </p>
                            <p className="mt-1 truncate leading-5 text-gray-500">
                              {`${endWide} ${endSgg} ${endDong}`}
                            </p>
                            <p className="mt-1 truncate leading-5 text-gray-500">
                              {formatDate(endPlanDt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center items-end gap-y-2">
                        <div
                          className={
                            "text-sm w-fit h-fit text-white font-bold px-2 py-1 rounded-full " +
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
                          <p>{ordStatus}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex flex-col sm:flex-row gap-x-1 w-full justify-between">
                      <div className="flex flex-col w-full sm:gap-x-10 sm:flex-row sm:items-start">
                        <div className="flex flex-col items-start gap-y-2 sm:w-80 w-full gap-x-5 mb-2">
                          <div className="w-full flex items-center justify-between">
                            <p className="flex items-center gap-x-3 text-sm font-semibold leading-6 text-gray-500">
                              {cargoDsc}
                            </p>
                            <div
                              className="text-sm font-semibold flex items-center text-slate-500 border border-slate-500 rounded-md py-1 px-2 hover:cursor-pointer hover:shadow-md"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCargoCopy(cargo_seq);
                              }}
                            >
                              <p>화물복사</p>
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
                          </div>
                          <div className="flex items-center gap-x-3">
                            <p className="px-2 py-0 rounded-md flex items-center h-5 shadow-md bg-gray-500 text-xs text-white">
                              {truckType}
                            </p>
                            {urgent && (
                              <p className="px-1 py-0 rounded-md flex items-center h-5 shadow-md bg-red-400 text-xs text-white">
                                {urgent}
                              </p>
                            )}
                            {multiCargoGub && (
                              <p className="px-1 py-0 rounded-md flex items-center h-5 shadow-md bg-indigo-400 text-xs text-white">
                                {multiCargoGub}
                              </p>
                            )}
                            {shuttleCargoInfo && (
                              <p className="px-1 py-0 rounded-md flex items-center h-5 bg-yellow-400 text-xs text-white">
                                {shuttleCargoInfo}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex text-xs sm:text-sm gap-x-4 items-center">
                          <div>
                            <p className="mt-1 truncate leading-5 font-bold text-gray-500">
                              {`${startCompanyName || ""} ${
                                formatPhoneNumber(startAreaPhone) || ""
                              }`}
                            </p>
                            <p className="mt-1 truncate leading-5 text-gray-500">
                              {`${startWide} ${startSgg} ${startDong} ${startDetail}`}
                            </p>
                            <p className="mt-1 truncate leading-5 text-gray-500">
                              {formatDate(startPlanDt)}
                            </p>
                          </div>
                          <div className="text-gray-500">
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
                                d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="mt-1 truncate leading-5 font-bold text-gray-500">
                              {`${endCompanyName || ""} ${
                                formatPhoneNumber(endAreaPhone) || ""
                              }`}
                            </p>
                            <p className="mt-1 truncate leading-5 text-gray-500">
                              {`${endWide} ${endSgg} ${endDong}`}
                            </p>
                            <p className="mt-1 truncate leading-5 text-gray-500">
                              {formatDate(endPlanDt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center items-end gap-y-2">
                        <div
                          className={
                            "text-sm w-fit h-fit text-white font-bold px-2 py-1 rounded-full " +
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
                          <p>{ordStatus}</p>
                        </div>
                        <div className="hidden sm:block text-sm w-max text-right h-fit text-gray-500 py-1">
                          <p>{create_dtm}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
      </ul>
      {/* <div className="fixed bottom-0 left-0 p-5 w-full border bg-white mt-6 flex items-center justify-end gap-x-6">
        <button
          type="button"
          className="rounded-md bg-darkCyan px-3 py-2 text-base font-semibold text-white shadow-sm"
          onClick={() => router.push("/orders/create")}
        >
          화물 등록
        </button>
      </div> */}
    </div>
  );
};

export default CargoList;
