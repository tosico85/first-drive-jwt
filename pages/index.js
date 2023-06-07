import { useContext, useEffect, useState } from "react";
import apiPaths from "../services/apiRoutes";
import AuthContext from "./context/authContext";
import { useRouter } from "next/router";
import { formatDate } from "../utils/StringUtils";

const HomePage = () => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const [cargoOrder, setCargoOrder] = useState([]);
  const [searchStatus, setSearchStatus] = useState("ALL");
  const router = useRouter();

  const getOrderList = async () => {
    const url =
      userInfo.auth_code == "ADMIN"
        ? apiPaths.adminGetCargoOrder
        : apiPaths.custReqGetCargoOrder;

    console.log(userInfo);
    console.log(url);
    const params = { delete_yn: "N" };

    const result = await requestServer(url, params);
    setCargoOrder(() => result);
    console.log("Cargo order >>", cargoOrder);
  };

  useEffect(() => {
    (async () => {
      await getOrderList();
    })();
  }, [userInfo]);

  //상세보기
  const handleDetail = (cargo_seq) => {
    router.push({
      pathname: "/orders/detail",
      query: { param: cargo_seq },
    });
  };

  const handleSearchStatus = (status) => {
    setSearchStatus(status);
  };

  return (
    <div className="py-6">
      <h3 className="text-base font-semibold leading-7 ">
        현재 등록 중인 화물 건입니다.
      </h3>
      <div className="flex justify-between mt-5">
        <div className="flex gap-x-2">
          <div
            className={
              "text-sm w-fit h-fit font-bold px-2 py-1 rounded-full border border-slate-400 hover:shadow-md " +
              (searchStatus == "ALL"
                ? "bg-slate-400 text-white"
                : "text-slate-400")
            }
            onClick={() => handleSearchStatus("ALL")}
          >
            전체
          </div>
          <div
            className={
              "text-sm w-fit h-fit font-bold px-2 py-1 rounded-full border border-slate-400 hover:shadow-md " +
              (searchStatus == "화물접수"
                ? "bg-slate-400 text-white"
                : "text-slate-400")
            }
            onClick={() => handleSearchStatus("화물접수")}
          >
            화물접수
          </div>
          <div
            className={
              "text-sm w-fit h-fit font-bold px-2 py-1 rounded-full border border-slate-400 hover:shadow-md " +
              (searchStatus == "배차신청"
                ? "bg-slate-400 text-white"
                : "text-slate-400")
            }
            onClick={() => handleSearchStatus("배차신청")}
          >
            배차신청
          </div>
          <div
            className={
              "text-sm w-fit h-fit font-bold px-2 py-1 rounded-full border border-slate-400 hover:shadow-md " +
              (searchStatus == "배차완료"
                ? "bg-slate-400 text-white"
                : "text-slate-400")
            }
            onClick={() => handleSearchStatus("배차완료")}
          >
            배차완료
          </div>
        </div>
        <p className="text-right">{`${
          cargoOrder.filter((item) => {
            if (searchStatus === "ALL") {
              return true;
            } else {
              return item.ordStatus === searchStatus;
            }
          }).length
        } 건`}</p>
      </div>
      <ul className="mt-6 border-y border-gray-200 dark:border-gray-300">
        {cargoOrder.length > 0 &&
          cargoOrder
            .filter((item) => {
              if (searchStatus === "ALL") {
                return true;
              } else {
                return item.ordStatus === searchStatus;
              }
            })
            .map((item) => {
              const {
                cargo_seq,
                startWide, //상차지 시/도
                startSgg, //상차지 구/군
                startDong, //상차지 읍/면/동
                endWide, //하차지 시/도
                endSgg, //하차지 구/군
                endDong, //하차지 읍/면/동
                multiCargoGub, //혼적여부("혼적")
                urgent, //긴급여부("긴급")
                shuttleCargoInfo, //왕복여부("왕복")
                truckType, //차량종류
                startPlanDt, //상차일("YYYYMMDD")
                endPlanDt, //하차일("YYYYMMDD")
                cargoDsc, //화물상세내용
                ordStatus, //화물상태(접수,완료등)
                create_dtm, //등록일시
              } = item;
              return (
                <li
                  className="border-b border-gray-100 dark:border-gray-200 flex justify-between gap-x-6 py-5 lg:px-5 hover:bg-gray-100"
                  key={cargo_seq}
                  onClick={() => handleDetail(cargo_seq)}
                >
                  <div className="flex gap-x-1 w-full justify-between">
                    <div className="flex flex-col w-fit lg:gap-x-10 lg:flex-row lg:items-start">
                      <div className="flex flex-col items-start gap-y-2 lg:w-80 w-full gap-x-5 mb-2">
                        <p className="flex items-center gap-x-3 text-sm font-semibold leading-6 text-gray-500 dark:text-gray-300">
                          {cargoDsc}
                        </p>
                        <div className="flex items-center gap-x-3">
                          <p className="px-2 py-0 rounded-md flex items-center h-5 shadow-md bg-gray-500 text-xs text-white dark:border dark:border-gray-700">
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
                      <div className="flex text-xs lg:text-sm gap-x-4 items-center">
                        <div>
                          <p className="mt-1 truncate leading-5 text-gray-500 dark:text-gray-300">
                            {`${startWide} ${startSgg} ${startDong}`}
                          </p>
                          <p className="mt-1 truncate leading-5 text-gray-500 dark:text-gray-300">
                            {formatDate(startPlanDt)}
                          </p>
                        </div>
                        <div>
                          <svg
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="mt-1 truncate leading-5 text-gray-500 dark:text-gray-300">
                            {`${endWide} ${endSgg} ${endDong}`}
                          </p>
                          <p className="mt-1 truncate leading-5 text-gray-500 dark:text-gray-300">
                            {formatDate(endPlanDt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center items-end gap-y-2">
                      <div
                        className={
                          "text-sm w-fit h-fit text-white font-bold dark:text-gray-300 px-2 py-1 rounded-full " +
                          (ordStatus == "화물접수"
                            ? "bg-indigo-400 ring-indigo-400"
                            : ordStatus == "배차신청"
                            ? "bg-orange-400 ring-orange-400"
                            : "bg-slate-400 ring-slate-400")
                        }
                      >
                        <p>{ordStatus}</p>
                      </div>
                      <div className="hidden sm:block text-sm w-fit h-fit text-gray-500 dark:text-gray-400 px-3 py-1">
                        <p>{create_dtm}</p>
                      </div>
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

export default HomePage;
