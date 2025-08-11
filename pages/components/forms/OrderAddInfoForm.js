import { useForm } from "react-hook-form";
import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";

export default function OrderAddInfoForm({
  cargo_seq,
  startWide,
  startSgg,
  startDong,
  startDetail,
  endWide,
  endSgg,
  endDong,
  endDetail,
  onCancel,
  onComplete,
}) {
  const { requestServer } = useContext(AuthContext);

  // react-hook-form 세팅
  const methods = useForm({ mode: "onSubmit" });
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = methods;

  // 최근 10건 과거 운임 데이터
  const [pastFares, setPastFares] = useState([]);
  // TMAP 경로 계산 상태
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // 날짜 형식 변환 헬퍼
  const formatDateHour = (isoString) => {
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}시`;
  };

  // 숫자에 콤마 추가 헬퍼
  const formatNumber = (num) => {
    if (num == null) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 과거 운임 10건 조회
  useEffect(() => {
    if (!cargo_seq) return;
    (async () => {
      const { resultCd, data, result } = await requestServer(
        apiPaths.adminGetPastAllocFare,
        { cargo_seq }
      );
      if (resultCd === "00") setPastFares(data);
      else console.warn("과거 운임 조회 실패:", result);
    })();
  }, [cargo_seq, requestServer]);

  // 곽용호
  //const TMAP_APP_KEY = "5VAwKbaMgf7WdTDgQL7cd2FugS2UR2JI82D1OwRz";

  //신현서
  const TMAP_APP_KEY = "5VAwKbaMgf7WdTDgQL7cd2FugS2UR2JI82D1OwRz";

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
      {
        headers: {
          appKey: TMAP_APP_KEY,
          "Content-Type": "application/json",
        },
      }
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

  // 상세주소 포함한 TMAP 경로 계산
  useEffect(() => {
    if (!startWide || !endWide) return;
    (async () => {
      setRouteLoading(true);
      const startAddr = `${startWide} ${startSgg} ${startDong} ${
        startDetail || ""
      }`.trim();
      const endAddr = `${endWide} ${endSgg} ${endDong} ${
        endDetail || ""
      }`.trim();
      const orig = await geocodeAddress(startAddr);
      const dest = await geocodeAddress(endAddr);
      if (orig && dest) {
        const result = await getRouteTmap(orig, dest, startAddr, endAddr);
        setRouteInfo(result || { error: "경로 탐색 오류" });
      } else {
        setRouteInfo({ error: "주소 변환 실패" });
      }
      setRouteLoading(false);
    })();
  }, [
    startWide,
    startSgg,
    startDong,
    startDetail,
    endWide,
    endSgg,
    endDong,
    endDetail,
  ]);

  // 화물 수정 API 호출
  const updateCargoOrder = async () => {
    if (!cargo_seq) {
      alert("오류 발생~!!");
      return;
    }
    const payload = { cargo_seq, ...getValues() };
    const { result, resultCd } = await requestServer(
      apiPaths.adminModCargoOrder,
      payload
    );
    if (resultCd === "00") {
      alert("화물 오더가 수정되었습니다.");
      const { fare, fareView, palletCount, inspectionRequired } = getValues();
      onComplete({ fare, fareView, palletCount, inspectionRequired });
    } else {
      alert(result);
    }
  };

  const onValid = () => updateCargoOrder();
  const onInvalid = () => console.log(errors);

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)}>
      <div className="border-b border-gray-900/10 pb-8">
        <h2 className="text-lg font-semibold leading-7">운송료 정보</h2>
        <p className="mt-1 text-sm leading-6 mb-5 text-gray-600">
          필요한 정보를 입력해주세요.
        </p>

        {/* TMAP 경로 결과 */}
        <div className="mb-4 text-sm">
          {routeLoading ? (
            <p className="text-gray-500">경로 계산 중…</p>
          ) : routeInfo?.error ? (
            <p className="text-red-500">{routeInfo.error}</p>
          ) : routeInfo ? (
            <p className="text-gray-700">
              {`거리: ${routeInfo.distance_km} km / 소요: ${(() => {
                const totalMin = Math.floor(routeInfo.duration_min);
                return totalMin >= 60
                  ? `${Math.floor(totalMin / 60)}시간 ${totalMin % 60}분`
                  : `${totalMin}분`;
              })()}`}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-y-6">
          {/* 운송료 */}
          <div>
            <label className="block text-sm font-medium leading-6">
              운송료
            </label>
            <input
              {...register("fare", { required: "운송료를 입력해주세요." })}
              type="number"
              placeholder="숫자만 입력하세요"
              className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            />
            <div className="text-red-500 text-center mt-1">
              {errors.fare?.message}
            </div>
          </div>

          {/* 화주노출용 운임 */}
          <div>
            <label className="block text-sm font-medium leading-6">
              운송료(화주노출용)
            </label>
            <input
              {...register("fareView", { required: "운송료를 입력해주세요." })}
              type="number"
              placeholder="숫자만 입력하세요"
              className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            />
            <div className="text-red-500 text-center mt-1">
              {errors.fareView?.message}
            </div>
          </div>

          {/* 파레트 수량 */}
          <div>
            <label className="block text-sm font-medium leading-6">
              파레트 수량
            </label>
            <input
              {...register("pallet_Count", {
                required: "파레트 수량을 입력해주세요.",
                min: { value: 0, message: "0개 이상 입력하세요." },
              })}
              type="number"
              placeholder="파레트 개수 입력"
              className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            />
            <div className="text-red-500 text-center mt-1">
              {errors.palletCount?.message}
            </div>
          </div>

          {/* 검수 있음 */}
          <div className="flex items-center space-x-2">
            <input
              {...register("inspection_Required", {
                setValueAs: (v) => (v ? 1 : 0),
              })}
              type="checkbox"
              id="inspectionRequired"
              className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="inspectionRequired" className="text-sm font-medium">
              검수 있음
            </label>
          </div>
        </div>
      </div>

      {/* 최근 10건 과거 운임 리스트 */}
      <div className="mt-8">
        <h3 className="text-md font-medium mb-2">최근 10건 과거 운임</h3>
        {pastFares.length > 0 ? (
          <table className="w-full text-sm border-collapse border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">생성일시</th>
                <th className="p-2 border">운송료</th>
                <th className="p-2 border">화주용 운임</th>
                <th className="p-2 border">추가운임</th>
              </tr>
            </thead>
            <tbody>
              {pastFares.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-2 border">
                    {formatDateHour(item.fetchedAt)}
                  </td>
                  <td className="p-2 border">{formatNumber(item.fare)}</td>
                  <td className="p-2 border">{formatNumber(item.fareView)}</td>
                  <td className="p-2 border">{formatNumber(item.addFare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">조회된 과거 운임이 없습니다.</p>
        )}
      </div>

      {/* 버튼 그룹 */}
      <div className="flex justify-end gap-x-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm border rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-mainColor3 text-white rounded-md hover:bg-mainColor2"
        >
          화물 수정
        </button>
      </div>
    </form>
  );
}
