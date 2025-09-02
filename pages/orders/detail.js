import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import Seo from "../components/Seo";
import AuthContext from "../context/authContext";
import axios from "axios";

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
  const [dupModalOpen, setDupModalOpen] = useState(false);

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
      width: "460px",
      height: "660px",
      borderRadius: "10px",
      transform: "translate(-50%, -50%)",
      boxShadow: "0px 0px 10px #e2e2e2",
    },
  };

  // 인성데이터

  const handleInsung = async (e) => {
    e.preventDefault();

    // 1) kind 값 결정 (라보→5, 다마스→2, 오토바이→1, 기본 2)
    let kind;
    switch (cargoOrder.truckType) {
      case "라보":
        kind = "5";
        break;
      case "다마스":
        kind = "2";
        break;
      case "오토바이":
        kind = "1";
        break;
      default:
        kind = "2";
    }

    // 2) sfast 값 결정 (오토바이 + 특송일 때만 3, 그 외 1)
    let sfast = "1";
    if (cargoOrder.truckType === "오토바이" && cargoOrder.cargoTon === "특송") {
      sfast = "3";
    }

    // 1) 맵 (그대로 사용)
    const chargeNameMap = {
      "whdtn9186@naver.com": "김종수",
      "hoi64310@naver.com": "안동진",
      "maktoob9681@hanmail.net": "임성수",
      "admin@naver.com": "곽용호",
      "pinkchina@naver.com": "신현서",
    };

    const chargeMobileMap = {
      "whdtn9186@naver.com": "01051969881",
      "hoi64310@naver.com": "01026609881",
      "maktoob9681@hanmail.net": "01053739681",
      "admin@naver.com": "01039811822",
      "pinkchina@naver.com": "01049022652",
    };

    // 2) username 정규화 (email → lower/trim, fallback은 change_user)
    const rawUsername = userInfo?.email ?? cargoOrder?.change_user ?? "";
    const username = rawUsername.trim().toLowerCase();

    // 디버깅용(공백 확인)
    console.log(
      `username='${username}'`,
      "hasKey:",
      username in chargeMobileMap
    );

    // 3) 이름/번호 결정 (널 병합으로 undefined 방지)
    const chargeName = chargeNameMap[username] ?? "";
    const chargeMobile = chargeMobileMap[username] ?? userInfo?.mobile ?? "";

    // 4) userInfo 로드 전이면 중단
    if (!username) {
      console.warn("username 없음: userInfo/change_user 로드 대기");
      // return 또는 이후 로직 실행 지연
    }

    // 5) 페이로드
    const payload = {
      user_id: "kawadd",
      c_name: cargoOrder.group_name,
      c_mobile: chargeMobile, // 여기서 항상 값이 들어가도록 위에서 보정
      s_start: cargoOrder.startCompanyName,
      start_telno: cargoOrder.startAreaPhone,
      start_sido: cargoOrder.startWide,
      start_gugun: cargoOrder.startSgg,
      start_dong: cargoOrder.startDong,
      start_location: `${cargoOrder.startWide} ${cargoOrder.startSgg} ${cargoOrder.startDong} ${cargoOrder.startDetail}`,
      s_dest: cargoOrder.endCompanyName,
      dest_telno: cargoOrder.endAreaPhone,
      dest_sido: cargoOrder.endWide,
      dest_gugun: cargoOrder.endSgg,
      dest_dong: cargoOrder.endDong,
      dest_location: `${cargoOrder.endWide} ${cargoOrder.endSgg} ${cargoOrder.endDong} ${cargoOrder.endDetail}`,
      kind,
      pay_gbn: "3",
      doc: "1",
      sfast,
      item_type: "2",
      memo: cargoOrder.cargoDsc,
      cargo_seq: cargoOrder.cargo_seq,
      c_charge_name: chargeName,
    };

    try {
      const { data } = await axios.post(
        "https://4pl.store/pages/in.php",
        //"http://localhost:4000/in.php",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      // 2) 서버가 에러 키를 반환한 경우
      if (data && data.error) {
        return alert(`서버 에러: ${data.error}`);
      }

      // 3) 성공 케이스
      if (Array.isArray(data) && data[0]?.code === "1000") {
        const serial = data[1]?.serial_number || "";
        alert(`인성 신청 완료\n운송장: ${serial}`);
        setCargoOrder((prev) => ({
          ...prev,
          ordNo: serial,
          ordStatus: "배차중",
        }));
        return;
      }

      // 4) 그 외 오류 메시지 처리
      let errMsg;
      if (Array.isArray(data)) {
        errMsg = data[0]?.msg || JSON.stringify(data);
      } else if (typeof data === "object") {
        errMsg = JSON.stringify(data);
      } else {
        errMsg = String(data);
      }
      alert(`실패: ${errMsg}`);
    } catch (err) {
      console.error("인성 신청 중 네트워크/예외 에러:", err);
      alert(`인성 신청 중 예외가 발생했습니다:\n${err.message}`);
    }
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

  /**
   * 화물 오더 상태변경
   */
  const handleAdminChangeOrderStatus = async (e) => {
    e.preventDefault();

    // 1) 서버 응답 전체를 찍어보기 (디버깅용)
    const resp = await requestServer(apiPaths.adminChangeOrderStatus, {
      cargo_seq: cargoOrder.cargo_seq,
    });
    console.log("서버 응답:", resp);

    // 2) 올바른 프로퍼티로 구조분해 할당
    const { resultCd, result } = resp;

    // 3) debug alert
    /*    
    alert(
      `서버에서 받은 resultCd: ${resultCd}\n서버에서 받은 result: ${result}`
    );
*/
    // 4) resultCd가 "96"(DUP_ADMIN)일 때 → 모달 열기
    if (resultCd === "96" || resultCd === 96) {
      setDupModalOpen(true);
      return;
    }

    // 5) 성공/실패 처리
    if (resultCd === "00") {
      alert("화물 오더 상태가 변경되었습니다.");
      router.push("/orders/list");
    } else {
      alert(result);
    }
  };

  const copyToClipboardbibi = async () => {
    // 클립보드에 복사할 내용 생성
    const {
      startWide,
      startSgg,
      startDong,
      startDetail,
      startCompanyName,
      endWide,
      endSgg,
      endDong,
      endDetail,
      endCompanyName,
      startAreaPhone,
      endAreaPhone,
      cargoTon,
      truckType,
      cargoDsc,
    } = cargoOrder;

    const startAddr = `${startWide} ${startSgg} ${startDong} / ${startDetail} ${startCompanyName}`;
    const endAddr = `${endWide} ${endSgg} ${endDong} / ${endDetail} ${endCompanyName}`;
    const clipboardText = `배차요청 드립니다.\n-상차지\n${startAddr} \n${startAreaPhone} \n\n-하차지\n${endAddr}\n${endAreaPhone}\n\n ${cargoTon} ${
      cargoTon !== "특송" ? "톤" : ""
    } ${truckType}\n\n${cargoDsc}\n\n업체-곽용호`;

    // 클립보드에 복사
    try {
      await navigator.clipboard.writeText(clipboardText);
      console.log("클립보드에 복사되었습니다.");
    } catch (err) {
      console.error("클립보드 복사 실패: ", err);
    }
  };

  const copyStartAddress = async () => {
    const { startWide, startSgg, startDong, startDetail } = cargoOrder;
    const text = `${startWide} ${startSgg} ${startDong} ${startDetail}`;
    try {
      await navigator.clipboard.writeText(text);
      //      alert("주소가 복사되었습니다.");
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  const copyEndAddress = async () => {
    const { endWide, endSgg, endDong, endDetail } = cargoOrder;
    const text = `${endWide} ${endSgg} ${endDong} ${endDetail}`;
    try {
      await navigator.clipboard.writeText(text);
      //alert("하차지 주소가 복사되었습니다.");
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  const copyToClipboard = async () => {
    // 클립보드에 복사할 내용 생성
    const {
      startWide,
      startSgg,
      startDong,
      startDetail,
      startCompanyName,
      endWide,
      endSgg,
      endDong,
      endDetail,
      endCompanyName,
      startAreaPhone,
      endAreaPhone,
    } = cargoOrder;

    const startAddr = `${startWide} ${startSgg} ${startDong} / ${startDetail} ${startCompanyName}`;
    const endAddr = `${endWide} ${endSgg} ${endDong} / ${endDetail} ${endCompanyName}`;
    const clipboardText = `상차지 \n${startAddr} \n${startAreaPhone} \n\n하차지\n${endAddr}\n${endAreaPhone}`;

    // 클립보드에 복사
    try {
      await navigator.clipboard.writeText(clipboardText);
      console.log("클립보드에 복사되었습니다.");
    } catch (err) {
      console.error("클립보드 복사 실패: ", err);
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
          startWide={cargoOrder.startWide}
          startSgg={cargoOrder.startSgg}
          startDong={cargoOrder.startDong}
          startDetail={cargoOrder.startDetail} // ← 디테일 주소 추가
          endWide={cargoOrder.endWide}
          endSgg={cargoOrder.endSgg}
          endDong={cargoOrder.endDong}
          endDetail={cargoOrder.endDetail} // ← 디테일 주소 추가
          onCancel={closeModal}
          onComplete={callbackModal}
          style={customModalStyles}
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

      <Modal
        isOpen={dupModalOpen}
        onRequestClose={() => setDupModalOpen(false)}
        contentLabel="중복 알림"
        style={{
          content: {
            top: "50%",
            left: "50%",
            width: "320px",
            padding: "20px",
            borderRadius: "8px",
            transform: "translate(-50%, -50%)",
          },
        }}
      >
        <p
          style={{
            color: "red",
            fontSize: "18px",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          이미 배차중 입니다.
        </p>
        <button
          onClick={() => setDupModalOpen(false)}
          style={{
            display: "block",
            margin: "0 auto",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#e74c3c",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          확인
        </button>
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
                  <div className="inline-flex items-center space-x-2">
                    <span>
                      {`${cargoOrder.startWide} ${cargoOrder.startSgg} ${cargoOrder.startDong} ${cargoOrder.startDetail}`}
                    </span>
                    <button
                      type="button"
                      onClick={copyStartAddress}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-100"
                    >
                      복사
                    </button>
                  </div>
                </dd>
              </div>

              <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                <dt className="text-sm font-semibold leading-6 ">상차일자</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                  {formatDate(cargoOrder.startPlanDt)}
                </dd>
              </div>

              {isAdmin && (
                <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                  <dt className="text-sm font-semibold leading-6">상차시간</dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      {cargoOrder.startPlanHour} 시 {cargoOrder.startPlanMinute}{" "}
                      분
                    </span>
                  </dd>
                </div>
              )}
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
                  <div className="inline-flex items-center space-x-2">
                    <span>
                      {`${cargoOrder.endWide} ${cargoOrder.endSgg} ${cargoOrder.endDong} ${cargoOrder.endDetail}`}
                    </span>
                    <button
                      type="button"
                      onClick={copyEndAddress}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-100"
                    >
                      복사
                    </button>
                  </div>
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
                  <div className="px-4 py-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
                    <dt className="text-sm font-semibold leading-6 ">
                      관리자용 메모
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 lg:col-span-2 lg:mt-0">
                      {cargoOrder.adminMemo || ""}
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 p-3 bg-white w-full border mt-6 pb-6 flex items-center justify-end lg:gap-x-6 gap-x-3">
        {isAdmin && cargoOrder.ordStatus === "화물접수" && (
          <button
            type="button"
            className="rounded-md bg-buttonZamboa px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
            onClick={handleAdminChangeOrderStatus}
          >
            상태변경(배차중)
          </button>
        )}
        {isAdmin && (
          <>
            <button
              type="button"
              className="rounded-md bg-buttonZamboa px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
              onClick={copyToClipboard}
            >
              차주전송
            </button>
          </>
        )}

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
          </>
        )}
        {isAdmin && (
          <>
            {/* 인성 신청 버튼 */}

            <button
              type="button"
              className="rounded-md bg-pink-300 px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
              onClick={handleAdminOrderAdd}
            >
              241시 신청
            </button>

            <button
              type="button"
              className="rounded-md bg-buttonZamboa px-2 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
              onClick={handleDirectAlloc}
            >
              수기 배차
            </button>

            <button
              type="button"
              className="rounded-md bg-pastelGreen px-4 py-2 text-sm lg:text-base font-semibold text-white shadow-sm"
              onClick={handleInsung}
            >
              인성 신청
            </button>
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
