import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import Seo from "../components/Seo";
import AuthContext from "../context/authContext";
import {
  addCommas,
  formatDate,
  formatPhoneNumber,
  isEmpty,
} from "../../utils/StringUtils";
import Modal from "react-modal";
import OrderAddInfoForm from "../components/forms/OrderAddInfoForm";
import DirectAllocModal from "../components/modals/DirectAllocModal";

export default function Detail() {
  const router = useRouter();
  const { requestServer, userInfo } = useContext(AuthContext);
  const [cargoOrder, setCargoOrder] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  let isAdmin = userInfo.auth_code === "ADMIN";

  useEffect(() => {
    (async () => {
      const {
        query: { param: cargo_seq },
      } = router;

      const url =
        userInfo.auth_code == "ADMIN"
          ? apiPaths.adminGetCargoOrder
          : apiPaths.custReqGetCargoOrder;
      const result = await requestServer(url, {
        cargo_seq,
      });
      console.log(result);

      if (result.length > 0) {
        setCargoOrder(() => result[0]);
      }
    })();
  }, [userInfo]);

  /*** Modal Controller ***/
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const callbackModal = (retVal) => {
    const updatedOrder = { ...cargoOrder };
    Object.assign(updatedOrder, retVal);
    setCargoOrder(updatedOrder);

    closeModal();
  };

  const openAllocModal = () => {
    setIsAllocModalOpen(true);
  };

  const closeAllocModal = () => {
    setIsAllocModalOpen(false);
  };

  const callbackAllocModal = () => {
    closeAllocModal();
    router.push("/orders/list");
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

  /**
   * 수기 배차 Modal Open
   */
  const handleDirectAlloc = (e) => {
    e.preventDefault();

    openAllocModal();
  };

  /**
   * (상태 : 화물접수) 화물 수정(화주/관리자)
   * @note 이미 배차 신청된 오더는 수정 불가
   */
  const handleModify = (e) => {
    e.preventDefault();

    if (cargoOrder.ordNo?.length > 0) {
      alert("배차신청된 오더는 수정이 불가합니다.");
    } else {
      const serializedQuery = encodeURIComponent(
        JSON.stringify({ cargoOrder: cargoOrder })
      );
      router.push({
        pathname: "/orders/modify",
        query: { serializedQuery },
      });
    }
  };

  /**
   * (상태 : 화물접수) 화물 접수취소(화주/관리자)
   * @note 이미 배차 신청된 오더는 삭제 불가
   */
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
        alert("화물 접수가 취소되었습니다.");
        router.push("/orders/list");
      } else {
        alert(result);
      }
    }
  };

  /**
   * (상태 : 화물접수) 화물 배차신청(관리자 only)
   * @note 화물접수 상태에서 호출 가능 : 화물24 API - 화물등록 호출
   */
  const handleAdminOrderAdd = async () => {
    //e.preventDefault();

    console.log(cargoOrder);
    //console.log(isEmpty(cargoOrder.fare));
    if (isEmpty(cargoOrder.fare) || cargoOrder.fare === "0") {
      openModal();
    } else {
      const { code, message } = await requestServer(apiPaths.apiOrderAdd, {
        cargo_seq: cargoOrder.cargo_seq,
      });

      if (code === 1) {
        alert("배차 신청되었습니다.");
        router.push("/orders/list");
      } else {
        alert(message);
      }
    }
  };

  /**
   * (상태 : 배차신청) 화물 배차 신청정보 수정(관리자 only)
   * @note 배차신청 상태에서만 호출 가능 : 화물24 API - 화물수정 호출
   */
  const handleAdminOrderModify = async () => {
    //e.preventDefault();

    const serializedQuery = encodeURIComponent(
      JSON.stringify({ cargoOrder: cargoOrder, isDirectApi: true })
    );
    router.push({
      pathname: "/orders/modify",
      query: { serializedQuery },
    });

    /* const { code, message } = await requestServer(apiPaths.apiOrderMod, {
      cargo_seq: cargoOrder.cargo_seq,
    });

    if (code === 1) {
      alert("화물 오더가 수정 되었습니다.");
      router.push("/");
    } else {
      alert(message);
    } */
  };

  /**
   * (상태 : 배차신청) 화물 삭제(관리자 only)
   * @note 배차신청 상태에서만 호출 가능 : 화물24 API - 화물삭제 호출
   * @param {*} e
   */
  const handleAdminOrderDelete = async (e) => {
    e.preventDefault();

    const { code, message } = await requestServer(apiPaths.apiOrderCancel, {
      ordNo: cargoOrder.ordNo,
      cargo_seq: cargoOrder.cargo_seq,
    });

    if (code !== -99) {
      alert("화물 오더가 취소 되었습니다.");
      router.push("/orders/list");
    } else {
      alert(message);
    }
  };

  return (
    <div className="">
      <Seo title={"화물 상세"} />
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Modal"
        style={customModalStyles}
      >
        <OrderAddInfoForm
          cargo_seq={cargoOrder.cargo_seq}
          onCancel={closeModal}
          onComplete={callbackModal}
        />
      </Modal>
      <Modal
        isOpen={isAllocModalOpen}
        onRequestClose={closeAllocModal}
        contentLabel="Modal"
        style={customModalStyles}
      >
        <DirectAllocModal
          paramObj={cargoOrder}
          onCancel={closeAllocModal}
          onComplete={callbackAllocModal}
        />
      </Modal>
      <div className="px-5 py-10 pb-20 bg-white">
        <div className="lg:px-4 px-0">
          <h3 className="text-base font-semibold leading-7 ">상차지 정보</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            상차지 주소 및 상차방법, 상차일자 정보
          </p>
          <div className="mt-4 border-y border-gray-100">
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">
                  상차지 주소
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  <div>
                    {`${cargoOrder.startWide} ${cargoOrder.startSgg} ${cargoOrder.startDong}`}
                  </div>
                  <div>{`${cargoOrder.startDetail}`}</div>
                </dd>
              </div>
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">상차일자</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {formatDate(cargoOrder.startPlanDt)}
                </dd>
              </div>
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">상차방법</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {cargoOrder.startLoad}
                </dd>
              </div>
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">
                  상차지 업체명
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {cargoOrder.startCompanyName}
                </dd>
              </div>
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">
                  상차지 전화번호
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {formatPhoneNumber(cargoOrder.startAreaPhone)}
                </dd>
              </div>
            </dl>
          </div>

          <h3 className="mt-10 text-base font-semibold leading-7 ">
            하차지 정보
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            하차지 주소 및 하차방법, 하차일자, 연락처 정보
          </p>
          <div className="mt-4 border-y border-gray-100">
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">
                  하차지 주소
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  <div>
                    {`${cargoOrder.endWide} ${cargoOrder.endSgg} ${cargoOrder.endDong}`}
                  </div>
                  <div>{`${cargoOrder.endDetail}`}</div>
                </dd>
              </div>
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">하차일자</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {formatDate(cargoOrder.endPlanDt)}
                </dd>
              </div>
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">하차방법</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {cargoOrder.endLoad}
                </dd>
              </div>
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">
                  하차지 업체명
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {cargoOrder.endCompanyName}
                </dd>
              </div>
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">
                  하차지 전화번호
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {formatPhoneNumber(cargoOrder.endAreaPhone)}
                </dd>
              </div>
            </dl>
          </div>

          <h3 className="mt-10 text-base font-semibold leading-7 ">
            화물 정보
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            화물 내용과 차량정보
          </p>
          <div className="mt-4 border-y border-gray-100">
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">
                  화물상세내용
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {cargoOrder.cargoDsc}
                </dd>
              </div>
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">
                  화물 선택사항
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {isAdmin && (
                    <div>
                      {`혼적여부 : ${
                        cargoOrder.multiCargoGub == "혼적" ? "Y" : "N"
                      }`}
                    </div>
                  )}

                  {isAdmin && (
                    <div>
                      {`긴급여부 : ${cargoOrder.urgent == "긴급" ? "Y" : "N"}`}
                    </div>
                  )}
                  <div>
                    {`왕복여부 : ${
                      cargoOrder.shuttleCargoInfo == "왕복" ? "Y" : "N"
                    }`}
                  </div>
                  <div>
                    {`착불여부 : ${
                      cargoOrder.farePaytype == "선착불" ? "Y" : "N"
                    }`}
                  </div>
                </dd>
              </div>
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">
                  차량 톤수(t)
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {cargoOrder.cargoTon}
                </dd>
              </div>
              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">차량 종류</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {cargoOrder.truckType}
                </dd>
              </div>
              {isAdmin && (
                <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                  <dt className="text-sm font-semibold leading-6 ">
                    적재 중량(t)
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                    {cargoOrder.frgton}
                  </dd>
                </div>
              )}
              {cargoOrder.fareView != "0" && (
                <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                  <dt className="text-sm font-semibold leading-6 ">운송료</dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                    {cargoOrder.fareView}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {isAdmin && (
            <div>
              <h3 className="mt-10 text-base font-semibold leading-7 ">
                화주 및 의뢰 정보
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                원화주 정보와 운송료 관련 정보
              </p>
              <div className="mt-4 border-y border-gray-100">
                <dl className="divide-y divide-gray-100">
                  <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                    <dt className="text-sm font-semibold leading-6 ">
                      의뢰자 구분
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                      {cargoOrder.firstType == "01"
                        ? "일반화주"
                        : "주선/운송사"}
                    </dd>
                  </div>
                  <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                    <dt className="text-sm font-semibold leading-6 ">
                      운송료 지불구분
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                      {cargoOrder.farePaytype}
                    </dd>
                  </div>
                  <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                    <dt className="text-sm font-semibold leading-6 ">
                      운송료 지급 예정일
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                      {formatDate(cargoOrder.payPlanYmd)}
                    </dd>
                  </div>
                  <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                    <dt className="text-sm font-semibold leading-6 ">
                      원화주 명
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                      {cargoOrder.firstShipperNm}
                    </dd>
                  </div>
                  <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                    <dt className="text-sm font-semibold leading-6 ">
                      원화주 전화번호
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                      {formatPhoneNumber(cargoOrder.firstShipperInfo)}
                    </dd>
                  </div>
                  <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                    <dt className="text-sm font-semibold leading-6 ">
                      원화주 사업자번호
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                      {cargoOrder.firstShipperBizNo}
                    </dd>
                  </div>
                  <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                    <dt className="text-sm font-semibold leading-6 ">
                      전자세금계산서 발행여부
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                      {isEmpty(cargoOrder.taxbillType)
                        ? "N"
                        : cargoOrder.taxbillType}
                    </dd>
                  </div>
                  {cargoOrder.fareView != "0" && (
                    <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                      <dt className="text-sm font-semibold leading-6 ">
                        운송료
                      </dt>
                      <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                        {addCommas(cargoOrder.fareView)}
                      </dd>
                    </div>
                  )}
                  {cargoOrder.addFare != "0" && (
                    <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                      <dt className="text-sm font-semibold leading-6 ">
                        추가비용
                      </dt>
                      <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                        {`${addCommas(cargoOrder.addFare)} / ${
                          cargoOrder.addFareReason
                        }`}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
          {isAdmin && (
            <>
              <h3 className="mt-10 text-base font-semibold leading-7 ">
                (관리자)부가정보
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                운송료 및 등록일자
              </p>
              <div className="mt-4 border-y border-gray-100">
                <dl className="divide-y divide-gray-100">
                  <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                    <dt className="text-sm font-semibold leading-6 ">운송료</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                      {addCommas(cargoOrder.fare)}
                    </dd>
                  </div>
                  <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                    <dt className="text-sm font-semibold leading-6 ">수수료</dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                      {addCommas(cargoOrder.fee)}
                    </dd>
                  </div>
                  <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                    <dt className="text-sm font-semibold leading-6 ">
                      배차신청일
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                      {formatDate(cargoOrder.allocReqDt) || "-"}
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 p-3 bg-white w-full border mt-6 pb-6 flex items-center justify-end lg:gap-x-6 gap-x-3">
        <button
          type="button"
          onClick={() => router.push("/orders/list")}
          className="rounded-md bg-normalGray px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
        >
          목록으로
        </button>
        {cargoOrder.ordStatus === "화물접수" && (
          <>
            <button
              type="button"
              className="rounded-md bg-mainBlue px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
              onClick={handleModify}
            >
              화물 수정
            </button>
            <button
              type="button"
              className="rounded-md bg-mainBlue px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
              onClick={handleDelete}
            >
              화물 삭제
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  className="rounded-md bg-buttonZamboa px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
                  onClick={handleAdminOrderAdd}
                >
                  배차 신청
                </button>
                <button
                  type="button"
                  className="rounded-md bg-buttonZamboa px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
                  onClick={handleDirectAlloc}
                >
                  수기 배차
                </button>
              </>
            )}
          </>
        )}

        {isAdmin && cargoOrder.ordStatus === "배차신청" && (
          <>
            <button
              type="button"
              className="rounded-md bg-buttonZamboa px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
              onClick={handleAdminOrderModify}
            >
              배차 수정
            </button>
            <button
              type="button"
              className="rounded-md bg-buttonZamboa px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
              onClick={handleAdminOrderDelete}
            >
              배차 취소
            </button>
          </>
        )}
      </div>
    </div>
  );
}
