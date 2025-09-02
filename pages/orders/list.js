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
import ReceiptUploadModal from "../components/modals/ReceiptUploadModal";
import ReceiptViewModal from "../components/modals/ReceptViewModal";
import { useGlobalContext } from "../../components/globalContext";
import axios from "axios";

export function formatDate_excel(dateInput) {
  const d = new Date(dateInput);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatYYYYMMDD(dateStr) {
  // dateStr: "20250702"
  if (!dateStr || dateStr.length !== 8) return "";
  const y = dateStr.substr(0, 4);
  const m = dateStr.substr(4, 2);
  const d = dateStr.substr(6, 2);
  return `${y}-${m}-${d}`;
}

const PHP_BASE = "https://kbtime.shop/call"; // 필요에 맞게 수정

// (A) 이메일 → PHP 파일명 매핑 (원하는 대로 하드코딩)
const FILE_MAP = {
  "admin@naver.com": "1_send_call.php",
  "whdtn9186@naver.com": "2_send_call.php",
  "hoi64310@naver.com": "3_send_call.php",
  "pinkchina@naver.com": "4_send_call.php",
  "maktoob9681@hanmail.net": "5_send_call.php",
  // ... 추가
};

// (B) 이메일 → device_id 매핑 (원하는 대로 하드코딩; 없으면 cjPhone 사용)
const DEVICE_ID_MAP = {
  "admin@naver.com": "android1",
  "whdtn9186@naver.com": "android2",
  "hoi64310@naver.com": "android3",
  "pinkchina@naver.com": "android4",
  "maktoob9681@hanmail.net": "android5",
  // ... 추가
};

const buildSendPhpFilename = (change_user) => {
  const key = (change_user || "").trim().toLowerCase();
  return FILE_MAP[key] || "1_send_call.php";
};

const buildDeviceId = (change_user, cjPhone) => {
  const key = (change_user || "").trim().toLowerCase();
  return DEVICE_ID_MAP[key] || cjPhone; // 매핑 없으면 cjPhone로 대체
};

const requestPhoneCall = async ({ cjPhone, change_user }) => {
  ////alert(change_user);
  if (!cjPhone) {
    alert("차주 연락처(cjPhone)가 없습니다.");
    return;
  }

  const phpFile = buildSendPhpFilename(change_user);
  const url = `${PHP_BASE}/${phpFile}`;
  const deviceId = buildDeviceId(change_user, cjPhone);

  const form = new FormData();
  // 1_send_call.php가 요구하는 필드
  form.append("device_id", deviceId);
  form.append("phone", cjPhone);

  // 참고용(서버에서 안쓸 수도 있음)
  form.append("change_user", change_user || "");

  try {
    const resp = await fetch(url, { method: "POST", body: form });
    if (!resp.ok) throw new Error(`PHP 호출 실패: ${resp.status}`);
    const data = await resp.json().catch(() => ({}));
    // 필요 시 응답 처리
    // console.log("send_call result:", data);
  } catch (err) {
    console.error(err);
    alert("전화 호출 중 오류가 발생했습니다.");
  }
};

const CargoList = () => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const { globalVariable, updateGlobalVariable } = useGlobalContext();

  const [cargoOrder, setCargoOrder] = useState([]);
  const [searchStatus, setSearchStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState(-1);

  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [isAddFareModalOpen, setIsAddFareModalOpen] = useState(false);
  const [isAddReceiptModalOpen, setIsAddReceiptModalOpen] = useState(false);
  const [isViewReceiptModalOpen, setIsViewReceiptModalOpen] = useState(false);

  // ① 과거 운임 10건 저장용
  const [pastFares, setPastFares] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);

  //const [companySearch, setCompanySearch] = useState("");
  const [hoveredCargoSeq, setHoveredCargoSeq] = useState(null);
  const TMAP_APP_KEY = "5VAwKbaMgf7WdTDgQL7cd2FugS2UR2JI82D1OwRz";
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  //
  async function geocodeWebGeo(address) {
    const url = `https://apis.openapi.sk.com/tmap/geo?${new URLSearchParams({
      version: "1",
      addressTypes: "ROAD",
      coordType: "WGS84GEO",
      address,
    })}`;
    const resp = await fetch(url, {
      headers: { appKey: TMAP_APP_KEY, "Content-Type": "application/json" },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const coords = data.features?.[0]?.geometry?.coordinates;
    return coords ? { lng: coords[0], lat: coords[1] } : null;
  }

  async function geocodePOI(address) {
    const url = `https://apis.openapi.sk.com/tmap/pois?${new URLSearchParams({
      version: "1",
      format: "json",
      count: "1",
      searchKeyword: address,
      reqCoordType: "WGS84GEO",
      resCoordType: "WGS84GEO",
    })}`;
    const resp = await fetch(url, {
      headers: { appKey: TMAP_APP_KEY, "Content-Type": "application/json" },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const poi = data.searchPoiInfo?.pois?.poi?.[0];
    return poi
      ? { lng: parseFloat(poi.frontLon), lat: parseFloat(poi.frontLat) }
      : null;
  }

  async function geocodeAddress(address) {
    return (await geocodeWebGeo(address)) || (await geocodePOI(address));
  }

  async function getRouteTmap(orig, dest, startName, endName) {
    const params = {
      version: "1",
      startX: orig.lng,
      startY: orig.lat,
      endX: dest.lng,
      endY: dest.lat,
      searchOption: "0",
      reqCoordType: "WGS84GEO",
      resCoordType: "WGS84GEO",
      startName,
      endName,
    };
    const resp = await fetch(
      `https://apis.openapi.sk.com/tmap/routes?${new URLSearchParams(params)}`,
      { headers: { appKey: TMAP_APP_KEY, "Content-Type": "application/json" } }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const props = data.features?.[0]?.properties;
    if (!props?.totalDistance || !props?.totalTime) return null;
    return {
      distance_km: Math.round((props.totalDistance / 1000) * 100) / 100,
      duration_min: Math.round((props.totalTime / 60) * 10) / 10,
    };
  }

  const fetchPastFares = async (cargoSeq) => {
    setLoadingPast(true);
    try {
      const { resultCd, data } = await requestServer(
        apiPaths.adminGetPastAllocFare,
        { cargo_seq: cargoSeq }
      );
      if (resultCd === "00") setPastFares(data);
      else setPastFares([]);
    } catch {
      setPastFares([]);
    }
    setLoadingPast(false);
  };

  const formatDateHour = (isoString) => {
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}시`;
  };

  // 숫자에 콤마 추가
  const formatNumber = (num) => {
    if (num == null) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 조회 조건 set
  let searchOptions = {
    start_dt: getOneWeekAgoDate(),
    end_dt: getTodayDate(),
    company_nm: "",
    startCompanyName: "",
    endCompanyName: "",
  };

  if (globalVariable["orderList"]?.searchOptions) {
    const globalSearchOptions = globalVariable["orderList"]["searchOptions"];
    searchOptions = {
      start_dt: globalSearchOptions["start_dt"],
      end_dt: globalSearchOptions["end_dt"],
      company_nm: globalSearchOptions["company_nm"],
      startCompanyName: globalSearchOptions["startCompanyName"],
      endCompanyName: globalSearchOptions["endCompanyName"],
    };
  }
  const [startSearchDt, setStartSearchDt] = useState(searchOptions["start_dt"]);
  const [endSearchDt, setEndSearchDt] = useState(searchOptions["end_dt"]);
  const companySearch = useInput(searchOptions["company_nm"]);
  const startCompanySearch = useInput(searchOptions["startCompanyName"]);
  const endCompanySearch = useInput(searchOptions["endCompanyName"]);

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

  const getStartAddr = (item) =>
    `${item.startWide || ""} ${item.startSgg || ""} ${item.startDong || ""}`
      .replace(/\s+/g, " ")
      .trim();
  const getEndAddr = (item) =>
    `${item.endWide || ""} ${item.endSgg || ""} ${item.endDong || ""}`
      .replace(/\s+/g, " ")
      .trim();

  const _distCache = new Map(); // "출발→도착" 캐시

  async function calcDistanceKm(item) {
    const startAddr = getStartAddr(item);
    const endAddr = getEndAddr(item);
    if (!startAddr || !endAddr) return "";

    const key = `${startAddr}→${endAddr}`;
    if (_distCache.has(key)) return _distCache.get(key);

    try {
      const [orig, dest] = await Promise.all([
        geocodeAddress(startAddr),
        geocodeAddress(endAddr),
      ]);
      if (!orig || !dest) {
        _distCache.set(key, "");
        return "";
      }
      const route = await getRouteTmap(
        orig,
        dest,
        item.startCompanyName || "출발지",
        item.endCompanyName || "도착지"
      );

      const km =
        typeof route?.distance_km === "number"
          ? Math.round(route.distance_km * 100) / 100 // 소수 둘째자리
          : "";
      _distCache.set(key, km);
      return km;
    } catch (e) {
      return "";
    }
  }

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Cargo Orders");

      // 엑셀 헤더 추가
      const headerRow = worksheet.addRow([
        isAdmin ? "전산번호" : "",
        "오더번호",
        isAdmin ? "회원아이디" : "",
        isAdmin ? "회원이름" : "",
        "화물상태",
        "상차일",
        "하차일",
        "등록일시",
        "상차지 업체명",
        "하차지 업체명",
        "상차지",
        "하차지",
        "차량종류",
        "운임료",
        "추가운임료",
        isAdmin ? "운임료(관리자용)" : "",
        "사용자메모",
        isAdmin ? "관리자메모" : "",
        "추가운임 사유",
        "왕복여부",
        "혼적여부",
        "긴급여부",
        "착불여부",
        "차주명",
        "차주연락처",
        "차량번호",
        "화물내용",
        isAdmin ? "관리자메모" : "",
        isAdmin ? "배차담당자" : "",
      ]);
      headerRow.font = { bold: true };

      // 엑셀 칸 너비 조정
      worksheet.columns = [
        { width: 10 }, // 주문 번호
        { width: 20 }, // 상차지 업체명
        { width: 20 }, // 하차지 업체명
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
        { width: 15 }, // 추가운임료
        { width: 20 }, // 추가운임료 사유
        { width: 20 }, // 사용자메모
        { width: 20 }, // 화물내용
        isAdmin ? { width: 15 } : 0, // 관리자용 운임료
        isAdmin ? { width: 15 } : 0, // 아이디
        isAdmin ? { width: 15 } : 0, // 차량번호
        isAdmin ? { width: 15 } : 0, // 관리번호
        isAdmin ? { width: 15 } : 0, // 관리자용메모
        isAdmin ? { width: 15 } : 0, // 관리자용메모
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
        // adminMemo 필터링 처리 (null 체크 추가)
        let adminMemoText = "";
        if (isAdmin && item.adminMemo) {
          const keywords = ["인성", "화물24", "원콜", "화물맨"];
          const matched = keywords.filter((keyword) =>
            item.adminMemo.includes(keyword)
          );
          adminMemoText =
            matched.length > 0 ? matched.join(",") : item.adminMemo;
        }

        // 엑셀 행 추가 (item.cargoDsc 다음에 adminMemoText 추가)
        const row = worksheet.addRow([
          item.cargo_seq,
          item.ordNo,
          isAdmin ? item.create_user : "",
          item.userName,
          item.ordStatus,
          `${item.startPlanDt} ${item.startPlanHour}:${item.startPlanMinute}`,
          `${item.endPlanDt} ${item.endPlanHour}:${item.endPlanMinute}`,
          item.create_dtm,
          item.startCompanyName,
          item.endCompanyName,
          `${item.startWide} ${item.startSgg} ${item.startDong}`,
          `${item.endWide} ${item.endSgg} ${item.endDong}`,
          `${item.cargoTon}톤 ${item.truckType}`,
          item.fareView,
          item.addFare,
          isAdmin ? item.fare : "",
          item.userMemo,
          isAdmin ? item.adminMemo : "",
          item.addFareReason,
          item.shuttleCargoInfo,
          item.multiCargoGub,
          item.urgent,
          item.farePaytype === "선착불" ? item.farePaytype : "",
          item.cjName,
          item.cjPhone,
          item.cjCarNum,
          item.cargoDsc,
          isAdmin ? adminMemoText : "",
          isAdmin ? item.change_user : "",
        ]);

        // 각 셀에 테두리 스타일 적용 (행 전체 셀에 대해 적용)
        row.eachCell({ includeEmpty: true }, (cell) => {
          setBorderStyle(cell, { style: "thin" });
        });
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

  const exportToExcelSummrary = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("정산내역서");

      // ▶ 사용자 조정 값: F열 폭 (원래 E열이던 곳)
      const fColWidth = 25;

      // ─── 요약용 리스트 한 번만 추출 ───
      const summaryList = filteredCargoList();
      let month = "";
      let company = "";
      if (summaryList.length > 0) {
        const rawDate = summaryList[0].startPlanDt; // "YYYYMMDD"
        const mm = rawDate.substr(4, 2); // "05"
        month = String(parseInt(mm, 10)); // "5"

        company = summaryList[0].group_name || "";
      }
      // ──────────────────────────────────

      // 1) 타이틀 (B1–E1)
      sheet.mergeCells("A1", "E1");
      sheet.mergeCells("A3", "B3");
      sheet.mergeCells("A4", "B4");

      const titleCell = sheet.getCell("A1");
      titleCell.value = `${month}월 차량배차 정산 내역서 (${company})`;

      titleCell.font = { size: 14, bold: true };
      titleCell.alignment = { vertical: "middle", horizontal: "left" };
      sheet.getRow(1).height = 20;
      sheet.getRow(7).height = 22;

      // 2) 요약 영역 (B3–C4 & E3–F4)
      sheet.getCell("B3").value = "항목";
      sheet.getCell("C3").value = "금액 (VAT 포함)";
      sheet.getCell("B4").value = `${month}월 차량비`;

      //      sheet.getCell("C4").value = 5167800;
      sheet.getCell("C4").numFmt = "#,##0";

      sheet.getCell("E3").value = "입금계좌";
      sheet.getCell("F3").value = "기업은행 : 052-114226-04-011 ㈜오성컨버전스";
      sheet.getCell("E4").value = "결제일";
      sheet.getCell("F4").value = "";

      const outer = { style: "thin" };
      const blueFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFBDD7EE" },
      };
      const whiteFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };

      // 요약 외곽선 & 배경
      // 파란 배경 & 테두리 적용 대상
      ["B3", "C3", "E3", "E4", "F4"].forEach((addr) => {
        const c = sheet.getCell(addr);
        c.fill = blueFill;
        c.border = { top: outer, left: outer, right: outer, bottom: outer };
        c.font = { bold: true };
        c.alignment = { vertical: "middle", horizontal: "center" };
      });

      // 흰 배경 & 테두리 적용 대상
      ["B4", "C4"].forEach((addr) => {
        const c = sheet.getCell(addr);
        c.fill = whiteFill;
        c.border = { top: outer, left: outer, right: outer, bottom: outer };
        c.font = { bold: true };
        c.alignment = { vertical: "middle", horizontal: "center" };
      });

      ["E3"].forEach((addr) => {
        const c = sheet.getCell(addr);
        c.border = { top: outer, left: outer, right: outer, bottom: outer };
        c.fill = blueFill;
        c.font = { bold: true };
        c.alignment = { vertical: "middle", horizontal: "center" };
      });
      ["F4"].forEach((addr) => {
        const c = sheet.getCell(addr);
        c.border = { top: outer, left: outer, right: outer, bottom: outer };
        c.fill = whiteFill;
        c.font = { bold: true };
        c.alignment = { vertical: "middle", horizontal: "center" };
      });
      // ─── F3에도 테두리 추가 ───
      const f3 = sheet.getCell("F3");
      f3.border = { top: outer, left: outer, right: outer, bottom: outer };
      f3.value = "기업은행 : 052-114226-04-011 ㈜오성컨버전스";
      f3.alignment = { vertical: "middle", horizontal: "center" };
      f3.font = { bold: true };

      sheet.getRow(3).height = 18;
      sheet.getRow(4).height = 18;

      // 3) 6행부터 빈 행 3개 삽입
      sheet.spliceRows(6, 0, [], [], []);

      // 4) 본문 헤더 (9행)
      // B9: "월"
      sheet.getCell("E6").value = `${month}월`;
      sheet.getCell("E6").fill = blueFill;
      sheet.getCell("E6").font = { bold: true };
      sheet.getCell("E6").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      sheet.getCell("E6").border = {
        top: outer,
        left: outer,
        bottom: outer,
        right: outer,
      };

      [
        ["F6", "차량비"],
        ["G6", "부가세"],
        ["J6", "총액"],
      ].forEach(([range, text]) => {
        sheet.mergeCells(range);
        const cell = sheet.getCell(range.split(":")[0]);
        cell.value = text;
        cell.fill = blueFill;
        cell.font = { bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = { top: outer, left: outer, bottom: outer, right: outer };
      });

      [["H7:I7", "대외비"]].forEach(([range, text]) => {
        sheet.mergeCells(range);
        const cell = sheet.getCell(range.split(":")[0]);
        cell.value = text;
        cell.fill = blueFill;
        cell.font = { bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = { top: outer, left: outer, bottom: outer, right: outer };
      });

      sheet.getRow(9).height = 25;

      // 5) 본문 데이터 (10행)
      sheet.mergeCells("F3:J3");
      sheet.mergeCells("F4:J4");

      [
        ["E7", ""],
        ["F7", 5162000],
        ["G7", 516200],
        ["J7", 5678200],
      ].forEach(([addr, val]) => {
        const c = sheet.getCell(addr);
        c.value = val;
        c.numFmt = "#,##0";
        c.alignment = { vertical: "middle", horizontal: "center" };
        c.border = { top: outer, left: outer, bottom: outer, right: outer };
      });
      sheet.getRow(10).height = 18;

      // 6) 컬럼 너비 (A–H)
      [5, 11, 20, 20, 12, 12, 12, 12, 12, 20, fColWidth].forEach((w, idx) => {
        sheet.getColumn(idx + 1).width = w;
      });

      // ──────────────────────────────────────────────────
      // ▼ 여기까지 1∼6단계: 기존 데이터와 위치 변경 없이 유지
      // ──────────────────────────────────────────────────

      // 7) 11행: 신규 테이블 헤더 삽입
      const extraHeaders = [
        "NO",
        "날짜",
        "픽업지",
        "도착지",
        "운송형태",
        "견적",
        "추가요금",
        "실운임",
        "착불수익",
        "특이사항",
      ];
      sheet.spliceRows(11, 0, extraHeaders);
      const hdrRow = sheet.getRow(11);
      hdrRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = { top: outer, left: outer, bottom: outer, right: outer };
        cell.fill = blueFill;
      });
      sheet.getRow(11).height = 20;

      const lightRedFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFCCCC" }, // 연한 붉은색
      };

      // 8) 12행부터: 실데이터 삽입
      const dataList = filteredCargoList();
      // summaryList[0].group_name 으로 회사명을 가져왔기 때문에
      if (company === "데코큐비클" || company === "쎌바이오택") {
        dataList.sort((a, b) => {
          // YYYYMMDD 형식이라 문자열 비교로도 작동하지만, 안전하게 숫자로 변환
          return parseInt(a.startPlanDt, 10) - parseInt(b.startPlanDt, 10);
        });
      }

      dataList.forEach((item, idx) => {
        const rowIdx = 12 + idx;
        const dateCell =
          company === "쎌바이오택"
            ? formatYYYYMMDD(item.startPlanDt) // YYYY-MM-DD로 포맷
            : formatDate_excel(item.create_dtm);

        const vals = [
          idx + 1,
          dateCell,
          item.startCompanyName,
          item.endCompanyName,
          `${item.cargoTon}톤 ${item.truckType}`,
          Number(item.fareView), // 견적
          Number(item.addFare), // 추가요금
          Number(item.fare), // 실운임(관리자용 운임)
          item.farePaytype === "착불" ? item.fareView : 0,
          item.adminMemo || "",
          item.userMemo || "",
        ];
        sheet.spliceRows(rowIdx, 0, vals);
        const r = sheet.getRow(rowIdx);
        r.eachCell((cell, col) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = {
            top: outer,
            left: outer,
            bottom: outer,
            right: outer,
          };

          const row = sheet.getRow(rowIdx);
          row.eachCell((cell, col) => {
            cell.font = { size: 10 };

            // 3,4번 컬럼만 좌측 정렬
            if (col === 3 || col === 4) {
              cell.alignment = { vertical: "middle", horizontal: "left" };
            } else {
              cell.alignment = { vertical: "middle", horizontal: "center" };
            }
            cell.border = {
              top: outer,
              left: outer,
              bottom: outer,
              right: outer,
            };
            if ([6, 7, 8, 9].includes(col) && typeof cell.value === "number") {
              cell.numFmt = '_(* #,##0_);_(* (#,##0);_(* "-"_);_(@_)'; // ← 회계 서식
            }
          });
          row.height = 18;
        });
      });

      // ──────────────────────────────────────────────
      // ↓↓  수정된 부분 ↓↓

      const startRow = 12;
      const endRow = startRow + dataList.length - 1;

      // F7: F12~F끝 + G12~G끝 합계
      const f7 = sheet.getCell("F7");
      f7.value = {
        formula: `SUM(F${startRow}:F${endRow},G${startRow}:G${endRow})`,
      };
      f7.numFmt = "#,##0";
      f7.alignment = { vertical: "middle", horizontal: "center" };
      f7.border = { top: outer, left: outer, bottom: outer, right: outer };

      // G7: F7의 10%
      const g7 = sheet.getCell("G7");
      g7.value = {
        formula: `F7*0.1`,
      };
      g7.numFmt = "#,##0";
      g7.alignment = { vertical: "middle", horizontal: "center" };
      g7.border = { top: outer, left: outer, bottom: outer, right: outer };

      // J7: F7 + G7
      const j7 = sheet.getCell("J7");
      j7.value = {
        formula: `F7+G7`, // ← 수정된 부분: J7에 F7+G7 수식
      };
      j7.numFmt = "#,##0";
      j7.alignment = { vertical: "middle", horizontal: "center" };
      j7.border = { top: outer, left: outer, bottom: outer, right: outer };

      const c4 = sheet.getCell("C4");
      c4.value = { formula: "F7+G7" }; // ← F7과 G7 값을 더하는 수식
      c4.numFmt = "#,##0";
      c4.alignment = { vertical: "middle", horizontal: "center" };
      c4.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
      // ← 여기에 배경색 노란색 적용
      c4.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" },
      };

      // ──────────────────────────────────────────────

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber >= 6) {
          [8, 9].forEach((col) => {
            const cell = row.getCell(col);
            cell.fill = lightRedFill;
          });
        }
      });
      // 9) 다운로드
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "정산내역서.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportClick = () => {
    exportToExcel();
  };

  const handleExportClickSummrary = () => {
    exportToExcelSummrary();
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
      startCompanyName: startCompanySearch.value, // 추가된 부분
      endCompanyName: endCompanySearch.value, // 추가된 부분
    };

    const result = await requestServer(url, params);
    setCargoOrder(() => result);

    // 조회조건 적재
    if (!globalVariable["orderList"]) {
      globalVariable["orderList"] = {};
    }
    globalVariable["orderList"] = {
      ...globalVariable["orderList"],
      searchOptions: { ...params },
    };
    updateGlobalVariable(globalVariable);

    // 스크롤 이동
    if (globalVariable["orderList"]?.scrollTop) {
      document
        .querySelector("ul")
        .scrollTo({ top: globalVariable["orderList"]?.scrollTop });
    }

    //console.log(globalVariable);
    //console.log("Cargo order >>", cargoOrder);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!globalVariable["orderList"]) {
        globalVariable["orderList"] = {};
      }
      globalVariable["orderList"] = {
        ...globalVariable["orderList"],
        scrollTop: document.querySelector("ul").scrollTop,
      };
      updateGlobalVariable(globalVariable);

      //console.log(globalVariable);
      //console.log('Scroll position:', document.querySelector("ul").scrollTop);
    };

    document.querySelector("ul").addEventListener("scroll", handleScroll);
  }, []);

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

  const openAddReceiptModal = () => {
    setIsAddReceiptModalOpen(true);
  };

  const closeAddReceiptModal = () => {
    setIsAddReceiptModalOpen(false);
  };

  const callbackAddReceiptModal = () => {
    closeAddReceiptModal();
    (async () => {
      await getOrderList();
    })();
  };

  const openViewReceiptModal = () => {
    setIsViewReceiptModalOpen(true);
  };

  const closeViewReceiptModal = () => {
    setIsViewReceiptModalOpen(false);
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

  //추가요금 수정 모달 스타일
  const customModalStyles_addReceipt = {
    content: {
      ...customModalStyles.content,
      width: "100vw",
      height: "100vh",
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
      adminMemo,
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
      userName,
      receipt_add_yn,
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

  //인수증 업로드
  const handleReceiptUpload = (cargo_seq) => {
    const cargoItem = {
      ...cargoOrder.find((item) => item.cargo_seq === cargo_seq),
    };

    if (cargoItem) {
      setSelectedOrder(cargoItem);
      openAddReceiptModal();
    }
  };

  const handleReceiptView = (cargo_seq) => {
    const cargoItem = {
      ...cargoOrder.find((item) => item.cargo_seq === cargo_seq),
    };

    if (cargoItem) {
      setSelectedOrder(cargoItem);
      openViewReceiptModal();
    }
  };

  const copyCjInfo = (cargo_seq) => {
    const cargoItem = {
      ...cargoOrder.find((item) => item.cargo_seq === cargo_seq),
    };

    if (cargoItem) {
      const clipboardText = `${
        isAdmin
          ? `배차정보 전달 드립니다. \n\n${cargoItem.startCompanyName} > ${cargoItem.endCompanyName} \n\n`
          : ""
      }${cargoItem.cjName} \n${cargoItem.cjPhone}\n${cargoItem.cjCarNum}\n${
        cargoItem.cjCargoTon
      }톤/${cargoItem.cjTruckType}\n`;

      try {
        navigator.clipboard.writeText(clipboardText);
      } catch (err) {
        console.error("클립보드 복사 실패: ", err);
      }
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
      <Modal
        isOpen={isAddReceiptModalOpen}
        onRequestClose={closeAddReceiptModal}
        contentLabel="Modal"
        style={customModalStyles_addReceipt}
      >
        <ReceiptUploadModal
          cargo_seq={selectedOrder.cargo_seq}
          onCancel={closeAddReceiptModal}
          onComplete={callbackAddReceiptModal}
        />
      </Modal>
      <Modal
        isOpen={isViewReceiptModalOpen}
        onRequestClose={closeViewReceiptModal}
        contentLabel="Modal"
        style={customModalStyles_addReceipt}
      >
        <ReceiptViewModal
          cargo_seq={selectedOrder.cargo_seq}
          onCancel={closeViewReceiptModal}
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
              <p className="py-3 whitespace-nowrap">전체</p>
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
              <p className="py-3 whitespace-nowrap">접수중</p>
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
              <p className="py-3 whitespace-nowrap">배차중</p>
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
              <p className="py-3 whitespace-nowrap">배차완료</p>
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
              <p className="py-3 whitespace-nowrap">취소</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-between w-full pb-5 border-b border-gray-200">
            <div
              className={
                "flex gap-x-3 gap-y-3 " + (isAdmin && "flex-col 2xl:flex-row")
              }
            >
              <div className="flex justify-start gap-x-2 items-center">
                <div className="shrink-0">
                  <ComboBox
                    onComboChange={handlePeriodChange}
                    list={selectPeriodList}
                    selectedValue={selectedPeriod}
                    title={"기간입력"}
                  />
                </div>
                <div className="z-">
                  <DateInput
                    dateValue={startSearchDt}
                    onDateChange={setStartSearchDt}
                    disabled={selectedPeriod != -1}
                    addClass="w-32"
                  />
                </div>
                <span>~</span>
                <div className="z-1">
                  <DateInput
                    dateValue={endSearchDt}
                    onDateChange={setEndSearchDt}
                    disabled={selectedPeriod != -1}
                    addClass="w-32"
                  />
                </div>
              </div>
              <div className="flex gap-x-3">
                {isAdmin && (
                  <div className="">
                    <input
                      type="text"
                      placeholder="업체명 검색"
                      onKeyDown={handleCompanySearch}
                      {...companySearch}
                      className="w-36 rounded-sm border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    />
                  </div>
                )}
                <div className="">
                  <input
                    type="text"
                    placeholder="상차지 업체명"
                    onKeyDown={handleCompanySearch}
                    {...startCompanySearch}
                    className="w-36 rounded-sm border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  />
                </div>
                <div className="">
                  <input
                    type="text"
                    placeholder="하차지 업체명"
                    onKeyDown={handleCompanySearch}
                    {...endCompanySearch}
                    className="w-36 rounded-sm border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  />
                </div>
                <div className="shrink-0">
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

                <div className="shrink-0">
                  {" "}
                  {/* 좌측 여백을 ml-3으로 수정 */}
                  <button
                    onClick={handleExportClick}
                    className="rounded-md bg-mainBlue px-5 py-3 text-sm lg:text-base font-semibold text-white shadow-sm cursor-pointer"
                  >
                    엑셀
                  </button>
                </div>
                {isAdmin && (
                  <div className="shrink-0 ml-3">
                    <button
                      onClick={handleExportClickSummrary}
                      className="rounded-md bg-mainBlue px-5 py-3 text-sm lg:text-base font-semibold text-white shadow-sm cursor-pointer"
                    >
                      정산서
                    </button>
                  </div>
                )}
              </div>
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
                  <p className="text-sm shrink-0">전체</p>
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
                  <p className="text-sm shrink-0">접수중</p>
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
                  <p className="text-sm shrink-0">배차중</p>
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
                  <p className="text-sm shrink-0">배차완료</p>
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
                  <p className="text-sm shrink-0">취소</p>
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
            <>
              {/* 기존 업체명 검색 */}
              <div>
                <input
                  type="text"
                  placeholder="업체명 검색"
                  onKeyDown={handleCompanySearch}
                  {...companySearch}
                  className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                />
              </div>

              {/* 출발지/도착지 한 줄 배치 (너비 제한) */}
              <div className="mt-2 flex gap-3">
                <input
                  type="text"
                  placeholder="출발지 업체명"
                  onKeyDown={handleCompanySearch}
                  {...startCompanySearch}
                  className="w-40 min-w-0 rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                />
                <input
                  type="text"
                  placeholder="도착지 업체명"
                  onKeyDown={handleCompanySearch}
                  {...endCompanySearch}
                  className="w-40 min-w-0 rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                />
              </div>
            </>
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
                adminMemo,
                userMemo,
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
                receipt_add_yn,
                farePaytype,
                change_user,
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
                            {`${startWide} ${startSgg} ${startDong} ${startDetail} [${startCompanyName}]`}
                          </p>
                        </div>
                        <div className="flex gap-x-2 items-center">
                          <p className="bg-mainColor3 rounded-lg text-white font-bold p-1 min-w-fit text-xs">
                            도착
                          </p>
                          <p className="truncate leading-5 text-gray-600 whitespace-pre-wrap">
                            {`${endWide} ${endSgg} ${endDong} ${endDetail} [${endCompanyName}]`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 bg-subBgColor4 rounded-b-xl flex flex-col gap-y-4">
                      {isAdmin && (
                        <div className="grid grid-cols-2 items-center">
                          <div className="flex flex-col items-start gap-y-1">
                            <span className="text-sm text-gray-400">
                              그룹명1
                            </span>
                            <span className="text-gray-600">
                              {group_name || "-"}
                            </span>
                            {/* 관리자일 때만 담당 표시 */}
                            {isAdmin && (
                              <span className="text-sm text-red-500">
                                {`담당 : ${
                                  {
                                    "hoi64310@naver.com": "안동진",
                                    "pinkchina@naver.com": "신현서",
                                    "admin@naver.com": "곽용호",
                                    "maktoob9681@hanmail.net": "임성수",
                                    "whdtn9186@naver.com": "김종수",
                                    "dladudal@naver.com": "임영미",
                                    "notalk1@naver.com": "안동진",
                                    "notalk2@naver.com": "신현서",
                                    "notalk3@hanmail.net": "임성수",
                                    "notalk@naver.com": "곽용호",
                                    "notalk4@naver.com": "김종수",
                                    "notalk5@naver.com": "김형국",
                                  }[change_user] || ""
                                }`}
                              </span>
                            )}
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
                          className="text-sm font-semibold w-20 flex items-center text-white bg-buttonSilver rounded-md py-1 px-3 hover:cursor-pointer hover:shadow-md"
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
                          <p className="shrink-0">복사</p>
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
                            className={`rounded-lg shadow-lg py-1 w-20 text-center ${
                              ordStatus === "배차완료" && receipt_add_yn === "Y"
                                ? "bg-blue-500 text-white border-blue-500"
                                : getStatusColorClass(ordStatus)
                            }`}
                            style={{
                              cursor:
                                ordStatus === "배차완료"
                                  ? "pointer"
                                  : "default",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (ordStatus === "배차완료") {
                                if (receipt_add_yn === "Y") {
                                  // 이미 인수증 있으면 보기
                                  handleReceiptView(cargo_seq);
                                } else if (isAdmin) {
                                  // 인수증 없으면 업로드
                                  handleReceiptUpload(cargo_seq);
                                }
                              }
                            }}
                          >
                            <span className="shrink-0 p-3">
                              {ordStatus === "화물접수"
                                ? "접수중"
                                : ordStatus === "배차신청"
                                ? "배차중"
                                : ordStatus === "배차완료" &&
                                  receipt_add_yn === "Y"
                                ? "완료"
                                : ordStatus === "배차완료"
                                ? "완료"
                                : ordStatus === "화물취소"
                                ? "취소"
                                : ordStatus}
                            </span>
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
                      <div
                        className="grid grid-cols-2"
                        onClick={(e) => {
                          e.stopPropagation(); // 이벤트 버블링 방지
                          copyCjInfo(cargo_seq); // 이벤트 핸들러 호출
                        }}
                      >
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
                          <span className="text-gray-600">
                            {cargoTon}
                            {cargoTon === "특송" ? "" : "톤"}
                          </span>
                        </div>
                      </div>
                      {ordStatus == "배차완료" && (
                        <div
                          className="grid grid-cols-2"
                          onClick={(e) => {
                            e.stopPropagation(); // 이벤트 버블링 방지
                            copyCjInfo(cargo_seq); // 이벤트 핸들러 호출
                          }}
                        >
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
                            <p>{cargo_seq}</p>
                          </>
                        ) : (
                          <p>{group_name}</p>
                        )}
                      </div>
                      <div className="col-span-2 px-5">
                        <div className="relative group">
                          <p
                            className={`mt-1 truncate leading-5 font-bold ${
                              [
                                "씨앤텍",
                                "씨앤택",
                                "씨엔텍",
                                "씨엔택",
                                "제이앤텍",
                                "두영",
                                "씨앤피코리아",
                                "제이팩토리",
                                "설옥화장품",
                              ].some((word) => startCompanyName.includes(word))
                                ? "animate-blink text-gray-500"
                                : "text-gray-500"
                            }`}
                          >
                            {`${startCompanyName || ""} ${
                              formatPhoneNumber(startAreaPhone) || ""
                            }`}
                          </p>
                          {["씨앤텍", "씨앤택", "씨엔텍", "씨엔택"].some(
                            (word) => startCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              차량 출발전 씨앤텍에 연락하고 입차 / 연락 없으면
                              입차불가
                            </div>
                          )}

                          {["제이앤텍"].some((word) =>
                            startCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              5톤 입차불가/3.5톤 초장축 5m20 이하로 배차
                            </div>
                          )}

                          {["제이팩토리"].some((word) =>
                            startCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              5시 30분전 입차/이후 상차불가능
                            </div>
                          )}
                          {["설옥화장품"].some((word) =>
                            startCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              우측 주소 확인후 진행 /인천 남동 고잔동 676-6
                            </div>
                          )}

                          {["두영"].some((word) =>
                            startCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              수작업/지게차 없음/1.4톤 이하 차량만 입차가능
                            </div>
                          )}
                          {["씨앤피코리아"].some((word) =>
                            startCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              수작업/지게차 없음
                            </div>
                          )}
                        </div>
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
                        <div className="relative group">
                          <p
                            className={`mt-1 truncate leading-5 font-bold ${
                              [
                                "씨앤텍",
                                "씨엔택",
                                "씨엔텍",
                                "씨엔텍",
                                "엔코스",
                                "한국콜마",
                                "리봄화장품",
                                "코스맥스",
                                "여우별",
                                "제이앤텍",
                                "하나코스",
                                "아이큐어",
                                "바이오코스텍",
                                "더마밀",
                                "뉴앤뉴",
                                "웰메이드생활건강",
                                "로지스뷰",
                                "로지뷰",
                                "두영",
                                "씨앤씨인터내셔널",
                                "주용테크",
                                "씨앤피코리아",
                                "피에프네이처",
                                "제이팩토리",
                                "소경",
                                "메가코스",
                                "주연테크",
                                "인터코스",
                                "지디케이",
                                "맵시",
                                "이글코리아",
                                "씨엔에프",
                                "디킨코스메틱",
                                "CS코리아",
                                "한국화장품",
                                "엔에프씨",
                                "페이스라인",
                                "서울화장품",
                                "뷰티스킨",
                                "설옥화장품",
                                "코리아나",
                                "리더스코스메틱",
                                "정코스",
                                "일진코스메틱",
                                "화성코스메틱",
                                "하나테크",
                                "영일 스크린",
                                "이용재",
                                "지앤텍",
                                "비앤비코리아",
                                "오션브리즈",
                                "배쓰프로젝트",
                                "성진하이텍",
                                "코스모코스",
                                "코스원",
                              ].some((word) => endCompanyName.includes(word)) &&
                              endCompanyName !== "미래엔코스메틱"
                                ? "animate-blink text-gray-500"
                                : "text-gray-500"
                            }`}
                          >
                            {`${endCompanyName || ""} ${
                              formatPhoneNumber(endAreaPhone) || ""
                            }`}
                          </p>
                          {["씨앤텍", "씨엔택", "씨엔텍", "씨엔텍"].some(
                            (word) => endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              4시이전도착/차량 출발전 씨앤텍에 통화하고
                              입차/연락 없으면 입차불가
                            </div>
                          )}

                          {["CS코리아"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              하차지 수작업
                            </div>
                          )}
                          {["배쓰프로젝트"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              차량 높이 3.6M이하 차량만 입차가능/길이는
                              확인해야함
                            </div>
                          )}
                          {["비앤비코리아"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              검수있음/이동하여 하차
                            </div>
                          )}
                          {["오션브리즈"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              지게차없음
                            </div>
                          )}
                          {["코스원"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              검수있음
                            </div>
                          )}

                          {["화성코스메틱"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              마곡동 제외/ 학운리만 품목별 검수있음
                            </div>
                          )}
                          {["성진하이텍"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              1톤/1.4톤 카고만 입차가능/협소하여 윙바디 불가능
                            </div>
                          )}

                          {["뷰티스킨"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              검수있음
                            </div>
                          )}
                          {["정코스"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              검수있음
                            </div>
                          )}
                          {["영일 스크린"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              지게차 없음/수작업
                            </div>
                          )}
                          {["코스모코스"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              검수있음
                            </div>
                          )}

                          {["리더스코스메틱"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              검수있음/5시40분이전 도착해야함
                            </div>
                          )}
                          {["일진코스메틱"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              검수있음/보통 한시간정도걸림/차주가 화주님을
                              귀찮게 하지 않도록 해주세요.
                            </div>
                          )}

                          {["서울화장품"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              검수 여부 가변
                            </div>
                          )}

                          {["설옥화장품"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              우측 주소 확인후 진행 /인천 남동 고잔동 676-6
                            </div>
                          )}

                          {["여우별", "주용테크"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              수작업/지게차 없음
                            </div>
                          )}

                          {["두영"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              수작업/지게차 없음/1.4톤 이하 차량만 입차가능
                            </div>
                          )}

                          {["코리아나"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              검수있음/품목별로 검수/박스마다 도장 날인작업 있음
                            </div>
                          )}

                          {["엔에프씨"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              수작업(파렛까대기)/검수있음/랩핑작업있음
                            </div>
                          )}

                          {["페이스라인"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              컨베이어 수작업 하차
                            </div>
                          )}

                          {["디킨코스메틱"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              5시 30분 이전입차/이후 하차불가
                            </div>
                          )}

                          {["맵시"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              수작업/지게차 없음
                            </div>
                          )}

                          {["지앤텍"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              수작업/지게차 없음
                            </div>
                          )}

                          {["지디케이", "이글코리아", "씨엔에프"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              검수있음/4시 이전도착/10초만 늦어도 하차불가
                            </div>
                          )}

                          {["메가코스"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              검수있음/5톤 이상 차량은 검수후 2키로 추가운행하여
                              하차
                            </div>
                          )}

                          {["인터코스", "한국화장품"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              검수있음/수작업 및 라벨작업있음
                            </div>
                          )}

                          {["소경"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              수작업/지게차 없음
                            </div>
                          )}

                          {["제이팩토리"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              5시30분 이전입차/이후하차 불가능
                            </div>
                          )}

                          {["씨앤피코리아"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              수작업/지게차 없음
                            </div>
                          )}

                          {["웰메이드생활건강"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              5시 이전도착/이후 절대 입고불가
                            </div>
                          )}

                          {["하나테크"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              수작업
                            </div>
                          )}

                          {["이용재"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              배차시 유의해주세요.클래임주의
                            </div>
                          )}

                          {["로지스뷰", "로지뷰"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              4시 30분 이전도착/이후 절대 입고불가
                            </div>
                          )}

                          {["더마밀"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              출발전 하차지에 꼭 전화/4시이전 도착
                            </div>
                          )}
                          {["제이앤텍"].some((word) =>
                            endCompanyName.includes(word)
                          ) && (
                            <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                              5톤 입차불가/3.5톤 초장축 5m20 이하로 배차
                            </div>
                          )}

                          {[
                            "엔코스",
                            "한국콜마",
                            "리봄화장품",
                            "코스맥스",
                            "아이큐어",
                            "하나코스",
                            "바이오코스텍",
                            "뉴앤뉴",
                            "씨앤씨인터내셔널",
                            "피에프네이처",
                          ].some((word) => endCompanyName.includes(word)) &&
                            endCompanyName !== "미래엔코스메틱" && (
                              <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 bg-gray-200 text-gray-800 text-sm rounded shadow-lg group-hover:block">
                                4시 이전 도착
                              </div>
                            )}
                        </div>
                        <p className="mt-1 truncate leading-5 text-gray-500 whitespace-pre-wrap">
                          {`${endWide} ${endSgg} ${endDong} ${endDetail}`}
                        </p>
                        <p className="mt-1 truncate leading-5 text-gray-500">
                          {`${formatDate(
                            endPlanDt
                          )} ${endPlanHour}:${endPlanMinute}`}
                        </p>
                      </div>

                      <div className="flex flex-col col-span-2 px-5 gap-y-1">
                        <p className="text-sm font-semibold leading-6 text-gray-500">
                          {cargoDsc}
                        </p>
                        <div className="flex items-center gap-x-3">
                          {isAdmin ? (
                            <p
                              className="px-2 py-0.5 rounded-md shadow-md bg-gray-500 text-sm text-white cursor-pointer"
                              title="전화 걸기"
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();

                                const change_user = (
                                  userInfo?.email || ""
                                ).toLowerCase();

                                requestPhoneCall({ cjPhone, change_user });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  requestPhoneCall({ cjPhone, change_user });
                                }
                              }}
                            >
                              {`${cargoTon}${
                                cargoTon === "특송" ? "" : "t"
                              } ${truckType}`}
                            </p>
                          ) : (
                            <p
                              className="px-2 py-0.5 rounded-md shadow-md bg-gray-500 text-sm text-white opacity-70 cursor-not-allowed"
                              title=""
                            >
                              {`${cargoTon}${
                                cargoTon === "특송" ? "" : "t"
                              } ${truckType}`}
                            </p>
                          )}
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

                          {farePaytype == "선착불" && (
                            <p className="px-2 py-0.5 rounded-md bg-orange-400 text-sm text-white">
                              {farePaytype}
                            </p>
                          )}
                        </div>

                        {!isAdmin &&
                          (create_user === "brglobal@brglobal.kr" ||
                            create_user === "hsy5003@hanmail.net" ||
                            create_user === "bc137@hanmail.net") &&
                          ordStatus === "배차완료" && (
                            <div>
                              <p className="text-sm font-semibold leading-6 text-blue-600">
                                {`운임 : ${Number(
                                  fareView
                                ).toLocaleString()}원`}
                              </p>
                              {addFare > 0 && (
                                <p className="text-sm font-semibold leading-6 text-red-400">
                                  {`추가운임 : ${Number(
                                    addFare
                                  ).toLocaleString()}원`}
                                </p>
                              )}
                            </div>
                          )}

                        {isAdmin && (
                          <div>
                            <p className="text-sm font-semibold leading-6 text-red-500">
                              {`요금(관리자용) : ${Number(
                                fare
                              ).toLocaleString()}원`}
                            </p>
                            <p className="text-sm font-semibold leading-6 text-purple-400">
                              {`요금(고객용) : ${Number(
                                fareView
                              ).toLocaleString()}원`}
                            </p>
                            {addFare > 0 && (
                              <p className="text-sm font-semibold leading-6 text-green-500">
                                {`추가요금 : ${Number(
                                  addFare
                                ).toLocaleString()}원`}
                              </p>
                            )}
                            <p className="text-sm font-semibold leading-6 text-blue-500">
                              {`담당 : ${
                                {
                                  "hoi64310@naver.com": "안동진",
                                  "pinkchina@naver.com": "신현서",
                                  "admin@naver.com": "곽용호",
                                  "maktoob9681@hanmail.net": "임성수",
                                  "whdtn9186@naver.com": "김종수",
                                  "dladudal@naver.com": "임영미",
                                  "notalk1@naver.com": "안동진",
                                  "notalk2@naver.com": "신현서",
                                  "notalk3@naver.com": "임성수",
                                  "notalk@naver.com": "곽용호",
                                  "notalk4@naver.com": "김종수",
                                  "notalk5@naver.com": "김형국",
                                }[change_user] || ""
                              }`}
                            </p>
                            <p className="text-sm font-semibold leading-6 text-red-500">
                              {adminMemo && `관리자메모 : ${adminMemo || ""}`}
                            </p>
                          </div>
                        )}

                        <p className="text-sm font-semibold leading-6 text-gray-500">
                          {userMemo && `사용자메모 : ${userMemo || ""}`}
                        </p>
                      </div>

                      <div
                        className="text-center flex flex-col items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCjInfo(cargo_seq);
                        }}
                      >
                        {ordStatus == "배차완료" && (
                          <div className="w-full mt-2 flex flex-col items-baseline text-base text-slate-500">
                            <span className="text-left">{`${cjName}`}</span>
                            <span className="text-left">{`${formatPhoneNumber(
                              cjPhone
                            )}`}</span>
                            <span className="text-left">{`${cjCarNum}`}</span>
                            <span className="text-left">{`${cjTruckType}`}</span>
                            <span className="text-left">
                              {`${cjCargoTon}`}톤
                            </span>
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
                          <>
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
                            {receipt_add_yn == "Y" && (
                              <div
                                className="text-sm text-white font-bold px-3 py-2 rounded-full mt-3 cursor-pointer bg-green-700 ring-green-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReceiptView(cargo_seq);
                                }}
                              >
                                <p className="shrink-0">하차완료</p>
                              </div>
                            )}
                            {receipt_add_yn == "N" && (
                              <div
                                className="text-sm text-white font-bold px-3 py-2 rounded-full mt-3 cursor-pointer bg-zinc-400 ring-zinc-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <p className="shrink-0">하차완료</p>
                              </div>
                            )}
                          </>
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
                        {isAdmin && (
                          <>
                            {/* 배차 버튼 + 호버 팝업 래퍼 */}
                            <div
                              className="relative inline-block w-full"
                              onMouseEnter={async (e) => {
                                e.stopPropagation();
                                setHoveredCargoSeq(cargo_seq);
                                fetchPastFares(cargo_seq);

                                // Tmap 경로 계산
                                setRouteLoading(true);
                                const startAddr = `${startWide} ${startSgg} ${startDong}`;
                                const endAddr = `${endWide} ${endSgg} ${endDong}`;
                                const orig = await geocodeAddress(startAddr);
                                const dest = await geocodeAddress(endAddr);
                                if (orig && dest) {
                                  const result = await getRouteTmap(
                                    orig,
                                    dest,
                                    startAddr,
                                    endAddr
                                  );
                                  setRouteInfo(
                                    result || { error: "경로 탐색 오류" }
                                  );
                                } else {
                                  setRouteInfo({ error: "주소 변환 실패" });
                                }
                                setRouteLoading(false);
                              }}
                              onMouseLeave={() => {
                                setHoveredCargoSeq(null);
                                setRouteInfo(null);
                              }}
                            >
                              {/* 실제 배차 버튼 */}
                              <div
                                className="text-sm font-semibold flex items-center justify-center gap-x-3 w-full text-slate-500 border border-slate-500 rounded-md py-1 px-3 cursor-pointer hover:shadow-md"
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
                                    d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25 M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                                  />
                                </svg>
                              </div>

                              {/* 호버할 때만 나타나는 팝업 */}
                              {hoveredCargoSeq === cargo_seq && (
                                <div
                                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-white border border-gray-300 shadow-lg z-50"
                                  style={{ width: 280 }}
                                >
                                  <div className="text-sm font-bold mb-1">
                                    최근 10건 과거 운임
                                  </div>
                                  {loadingPast ? (
                                    <p className="text-center text-xs">
                                      로딩 중…
                                    </p>
                                  ) : pastFares.length > 0 ? (
                                    <table className="w-full text-xs border-collapse">
                                      <thead>
                                        <tr>
                                          <th className="border px-1">
                                            생성일시
                                          </th>
                                          <th className="border px-1">
                                            운송료
                                          </th>
                                          <th className="border px-1">
                                            화주용 운임
                                          </th>
                                          <th className="border px-1">
                                            추가운임
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {pastFares.map((f, idx) => (
                                          <tr
                                            key={idx}
                                            className={
                                              idx % 2 === 0 ? "bg-gray-50" : ""
                                            }
                                          >
                                            <td className="border px-1">
                                              {formatDateHour(f.fetchedAt)}
                                            </td>
                                            <td className="border px-1">
                                              {formatNumber(f.fare)}
                                            </td>
                                            <td className="border px-1">
                                              {formatNumber(f.fareView)}
                                            </td>
                                            <td className="border px-1">
                                              {formatNumber(f.addFare)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <p className="text-center text-xs text-gray-500">
                                      조회된 과거 운임이 없습니다.
                                    </p>
                                  )}

                                  {/* Tmap 경로 정보 */}
                                  <div className="mt-2 text-xs text-gray-700">
                                    {routeLoading && <p>경로 계산 중…</p>}
                                    {routeInfo?.error && (
                                      <p className="text-red-500">
                                        {routeInfo.error}
                                      </p>
                                    )}
                                    {!routeLoading &&
                                      routeInfo &&
                                      !routeInfo.error && (
                                        <p className="text-gray-700">
                                          {`거리: ${
                                            routeInfo.distance_km
                                          } km / 소요: ${(() => {
                                            const totalMin = Math.floor(
                                              routeInfo.duration_min
                                            );
                                            return totalMin >= 60
                                              ? `${Math.floor(
                                                  totalMin / 60
                                                )}시간 ${totalMin % 60}분`
                                              : `${totalMin}분`;
                                          })()}`}
                                        </p>
                                      )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 인수증 버튼 (배차완료 상태에서만) */}
                            {ordStatus === "배차완료" &&
                              receipt_add_yn === "" && (
                                <div
                                  className="text-sm font-semibold flex items-center justify-center gap-x-3 w-full text-slate-500 border border-slate-500 rounded-md py-1 px-3 cursor-pointer hover:shadow-md mt-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReceiptUpload(cargo_seq);
                                  }}
                                >
                                  <p className="shrink-0">인수증</p>
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
                                      d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15"
                                    />
                                  </svg>
                                </div>
                              )}
                          </>
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
