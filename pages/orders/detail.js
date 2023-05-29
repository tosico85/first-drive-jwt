import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import Seo from "../components/Seo";
import AuthContext from "../context/authContext";

function formatDate(inputDate) {
  if (!inputDate) {
    return "";
  }

  const year = inputDate.substring(0, 4);
  const month = inputDate.substring(4, 6);
  const day = inputDate.substring(6, 8);

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

function formatPhoneNumber(inputData) {
  if (!inputData) {
    return "";
  }

  let result = "";
  if (inputData.length === 11) {
    result = `${inputData.substring(0, 3)}-${inputData.substring(
      3,
      7
    )}-${inputData.substring(7, 11)}`;
  } else if (inputData) {
    result = `${inputData.substring(0, 2)}-${inputData.substring(
      2,
      6
    )}-${inputData.substring(6, 10)}`;
  } else {
    return "";
  }

  return result;
}

export default function Detail() {
  const router = useRouter();
  const { requestServer } = useContext(AuthContext);
  const [cargoOrder, setCargoOrder] = useState({});

  useEffect(() => {
    (async () => {
      const {
        query: { param: cargo_seq },
      } = router;

      const result = await requestServer(apiPaths.custReqGetCargoOrder, {
        cargo_seq,
      });
      console.log(result);

      if (result.length > 0) {
        setCargoOrder(() => result[0]);
      }
    })();
  }, []);

  const handleModify = (e) => {
    e.preventDefault();

    if (cargoOrder.ordNo?.length > 0) {
      alert("배차신청된 오더는 수정이 불가합니다.");
    } else {
      router.push({
        pathname: "/orders/modify",
        query: cargoOrder,
      });
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();

    if (cargoOrder.ordNo?.length > 0) {
      alert("배차신청된 오더는 취소가 불가합니다.");
    } else {
      const { resultCd, result } = await requestServer(
        apiPaths.custReqCancelCargoOrder,
        {
          cargo_seq: cargoOrder.cargo_seq,
        }
      );

      if (resultCd === "00") {
        alert("화물 오더가 취소되었습니다.");
        router.push("/");
      } else {
        alert(result);
      }
    }
  };

  return (
    <div className="py-6">
      <Seo title={"화물 상세"} />
      <div className="text-gray-900 dark:text-white">
        <div className="lg:px-4 px-0">
          <h3 className="text-base font-semibold leading-7 ">상차지 정보</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            상차지 주소 및 상차방법, 상차일자 정보
          </p>
          <div className="mt-4 border-y border-gray-100 dark:border-gray-300">
            <dl className="divide-y divide-gray-100 dark:divide-gray-500">
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  상차지 주소
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  <div>
                    {`${cargoOrder.startWide} ${cargoOrder.startSgg} ${cargoOrder.startDong}`}
                  </div>
                  <div>{`${cargoOrder.startDetail}`}</div>
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  상차일자
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {formatDate(cargoOrder.startPlanDt)}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  상차방법
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {cargoOrder.startLoad}
                </dd>
              </div>
            </dl>
          </div>

          <h3 className="mt-10 text-base font-semibold leading-7 ">
            하차지 정보
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            하차지 주소 및 하차방법, 하차일자, 연락처 정보
          </p>
          <div className="mt-4 border-y border-gray-100 dark:border-gray-300">
            <dl className="divide-y divide-gray-100 dark:divide-gray-500">
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  하차지 주소
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  <div>
                    {`${cargoOrder.endWide} ${cargoOrder.endSgg} ${cargoOrder.endDong}`}
                  </div>
                  <div>{`${cargoOrder.endDetail}`}</div>
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  하차일자
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {formatDate(cargoOrder.endPlanDt)}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  하차방법
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {cargoOrder.endLoad}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  하차지 전화번호
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {formatPhoneNumber(cargoOrder.endAreaPhone)}
                </dd>
              </div>
            </dl>
          </div>

          <h3 className="mt-10 text-base font-semibold leading-7 ">
            화물 정보
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            화물 내용과 차량정보
          </p>
          <div className="mt-4 border-y border-gray-100 dark:border-gray-300">
            <dl className="divide-y divide-gray-100 dark:divide-gray-500">
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  화물상세내용
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {cargoOrder.cargoDsc}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  화물 선택사항
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  <div>
                    {`혼적여부 : ${
                      cargoOrder.multiCargoGub == "혼적" ? "Y" : "N"
                    }`}
                  </div>
                  <div>
                    {`긴급여부 : ${cargoOrder.urgent == "긴급" ? "Y" : "N"}`}
                  </div>
                  <div>
                    {`왕복여부 : ${
                      cargoOrder.shuttleCargoInfo == "왕복" ? "Y" : "N"
                    }`}
                  </div>
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  차량 톤수(t)
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {cargoOrder.cargoTon}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  차량 종류
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {cargoOrder.truckType}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  적재 중량(t)
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {cargoOrder.frgton}
                </dd>
              </div>
            </dl>
          </div>

          <h3 className="mt-10 text-base font-semibold leading-7 ">
            화주 및 의뢰 정보
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            원화주 정보와 운송료 관련 정보
          </p>
          <div className="mt-4 border-y border-gray-100 dark:border-gray-300">
            <dl className="divide-y divide-gray-100 dark:divide-gray-500">
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  의뢰자 구분
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {cargoOrder.firstType}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  운송료 지불구분
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {cargoOrder.farePaytype}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  운송료 지급 예정일
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {formatDate(cargoOrder.payPlanYmd)}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  원화주 명
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {cargoOrder.firstShipperNm}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  원화주 전화번호
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {formatPhoneNumber(cargoOrder.firstShipperInfo)}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  원화주 사업자번호
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {cargoOrder.firstShipperBizNo}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-white">
                  전자세금계산서 발행여부
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                  {cargoOrder.taxbillType}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm font-semibold leading-6"
        >
          목록으로
        </button>
        <button
          type="button"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          onClick={handleModify}
        >
          화물 수정
        </button>
        <button
          type="button"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          onClick={handleDelete}
        >
          화물 삭제
        </button>
      </div>
    </div>
  );
}
