import { useContext, useEffect, useState } from "react";
import apiPaths from "../services/apiRoutes";
import AuthContext from "./context/authContext";
import { getDayYYYYMMDD, getMonthYYYYMM } from "../utils/StringUtils";

const HomePage = () => {
  const { requestServer } = useContext(AuthContext);
  const [statistics, setStatistics] = useState({});

  useEffect(() => {
    (async () => {
      await getDashBoard();
    })();
  }, []);

  const getDashBoard = async () => {
    const result = await requestServer(apiPaths.commonGetDashboard, {});
    const lastMonth = getMonthYYYYMM(-1);
    const currentMonth = getMonthYYYYMM();
    const yesterDay = getDayYYYYMMDD(-1);

    console.log(lastMonth);
    console.log(currentMonth);
    console.log(yesterDay);

    if (result?.length > 0) {
      const filteredResult = result
        .filter(({ createDt }) => {
          return [lastMonth, currentMonth, yesterDay].includes(createDt);
        })
        .map(({ createDt, statusReqShip, statusComplete }) => {
          let count = "0";
          try {
            count = (
              Number.parseInt(statusReqShip) + Number.parseInt(statusComplete)
            ).toString();
          } catch (error) {
            console.log(error);
          }

          if (createDt === lastMonth) {
            return { lastMonth: count };
          } else if (createDt === currentMonth) {
            return { currentMonth: count };
          } else {
            return { yesterDay: count };
          }
        });

      const mergeData = Object.assign(
        { lastMonth: "0", currentMonth: "0", yesterDay: "0" },
        ...filteredResult
      );
      //console.log(result);
      setStatistics(mergeData);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-center px-5 py-10 gap-x-2 border-b border-gray-300 font-NotoSansKRMedium">
        <div className="relative flex flex-col w-full bg-white border border-gray-200 shadow-md rounded-xl">
          <div className="absolute top-0 left-0 w-full bg-mainColor2 rounded-t-xl">
            <p className="text-white font-bold text-base text-center py-2">
              전월 배차
            </p>
          </div>
          <div className="flex flex-col items-center justify-center mt-8 p-8">
            <p className="font-extrabold text-3xl">{statistics.lastMonth}</p>
          </div>
        </div>
        <div className="relative flex flex-col w-full bg-white border border-gray-200 shadow-md rounded-xl">
          <div className="absolute top-0 left-0 w-full bg-mainColor2 rounded-t-xl">
            <p className="text-white font-bold text-base text-center py-2">
              이달 배차
            </p>
          </div>
          <div className="flex flex-col items-center justify-center mt-8 p-8">
            <p className="font-extrabold text-3xl">{statistics.currentMonth}</p>
          </div>
        </div>
        <div className="relative flex flex-col w-full bg-white border border-gray-200 shadow-md rounded-xl">
          <div className="absolute top-0 left-0 w-full bg-mainColor2 rounded-t-xl">
            <p className="text-white font-bold text-base text-center py-2">
              전일 배차
            </p>
          </div>
          <div className="flex flex-col items-center justify-center mt-8 p-8">
            <p className="font-extrabold text-3xl">{statistics.yesterDay}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col mt-5 p-5 text-black">
        <p className="text-xl font-bold">{"< 공지사항 >"}</p>
        <ul className="flex flex-col p-5 gap-y-3 font-NotoSansKRMedium"></ul>
      </div>
      {/*
      <div className="p-5">
        <div className="flex items-end w-full gap-x-3">
          <span>날씨</span>
          <span className="text-xs text-gray-400">현재위치: 서울</span>
        </div>
        <div className="flex flex-col gap-y-3 bg-gray-800 text-gray-200 rounded-lg w-96">
          <div className="grid grid-cols-3 justify-evenly px-10">
            <div className="flex items-center">
              <span>오늘</span>
            </div>
            <div className="flex">
              <div>햇님</div>
              <div className="flex flex-col">
                <div>오전</div>
                <div>23</div>
              </div>
            </div>
            <div className="flex">
              <div>햇님</div>
              <div className="flex flex-col">
                <div>오후</div>
                <div>18</div>
              </div>
            </div>
          </div>
          <div className="px-5">
            <div className="border-t border-gray-200"></div>
          </div>
          <div className="grid grid-cols-3 justify-evenly px-10">
            <div className="flex items-center">
              <span>내일</span>
            </div>
            <div className="flex">
              <div>햇님</div>
              <div className="flex flex-col">
                <div>오전</div>
                <div>23</div>
              </div>
            </div>
            <div className="flex">
              <div>햇님</div>
              <div className="flex flex-col">
                <div>오후</div>
                <div>18</div>
              </div>
            </div>
          </div>
        </div>
        </div>
*/}
    </div>
  );
};

export default HomePage;
