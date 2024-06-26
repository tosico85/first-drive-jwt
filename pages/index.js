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
      <div className="flex items-center justify-center px-5 py-10 gap-x-2 border-b border-gray-300 font-Montserrat">
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

      {
        <div className="mt-8 mx-5 flex">
          <div className="bg-gray-100 p-6 rounded-lg shadow-md flex-1">
            <h2 className="text-xl font-semibold mb-4">공지사항</h2>
          </div>
        </div>
      }
    </div>
  );
};

export default HomePage;
