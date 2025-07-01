import { useForm } from "react-hook-form";
import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";

export default function OrderAddInfoForm({ cargo_seq, onCancel, onComplete }) {
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

  // 날짜 형식 변환 헬퍼
  const formatDateHour = (isoString) => {
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}시`;
  };

  // 화물 수정 API 호출
  const updateCargoOrder = async () => {
    if (!cargo_seq) {
      alert("오류 발생~!!");
      return;
    }
    // getValues()에 palletCount, inspectionRequired 포함됨
    const payload = { cargo_seq, ...getValues() };
    const { result, resultCd } = await requestServer(
      apiPaths.adminModCargoOrder,
      payload
    );

    if (resultCd === "00") {
      alert("화물 오더가 수정되었습니다.");
      // 필요한 값들만 꺼내서 부모 콜백 전달
      const { fare, fareView, palletCount, inspectionRequired } = getValues();
      onComplete({ fare, fareView, palletCount, inspectionRequired });
    } else {
      alert(result);
    }
  };

  const onValid = () => updateCargoOrder();
  const onInvalid = () => console.log(errors);

  const formatNumber = (num) => {
    if (num == null) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // mount 시, cargo_seq 기준으로 과거 운임 10건 조회
  useEffect(() => {
    if (!cargo_seq) return;
    (async () => {
      const { resultCd, data, result } = await requestServer(
        apiPaths.adminGetPastAllocFare,
        { cargo_seq }
      );
      if (resultCd === "00") {
        setPastFares(data);
      } else {
        console.warn("과거 운임 조회 실패:", result);
      }
    })();
  }, [cargo_seq, requestServer]);

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)}>
      <div className="border-b border-gray-900/10 pb-8">
        <h2 className="text-lg font-semibold leading-7">운송료 정보</h2>
        <p className="mt-1 text-sm leading-6 mb-5 text-gray-600">
          필요한 정보를 입력해주세요.
        </p>
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
          {/* 검수 있음 체크박스 */}
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
        </div>
      </div>

      {/* 최근 10건 과거 운임 리스트 (변경 없음) */}
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
    </form>
  );
}
