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
    const payload = { cargo_seq, ...getValues() };
    const { result, resultCd } = await requestServer(
      apiPaths.adminModCargoOrder,
      payload
    );

    if (resultCd === "00") {
      alert("화물 오더가 수정되었습니다.");
      const [fare, fareView] = getValues(["fare", "fareView"]);
      onComplete({ fare, fareView });
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
      {/* 운송료 입력 */}
      <div className="border-b border-gray-900/10 pb-8">
        <h2 className="text-lg font-semibold leading-7">운송료 정보</h2>
        <p className="mt-1 text-sm leading-6 mb-5 text-gray-600">
          운송료를 입력해주세요.
        </p>
        <div className="grid grid-cols-1 gap-y-6">
          <div>
            <label className="block text-sm font-medium leading-6">
              운송료
            </label>
            <input
              {...register("fare", { required: "운송료를 입력해주세요." })}
              type="number"
              maxLength={10}
              placeholder="숫자만 입력하세요"
              className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            />
            <div className="text-red-500 text-center mt-1">
              {errors.fare?.message}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium leading-6">
              운송료(화주노출용)
            </label>
            <input
              {...register("fareView", {
                required: "운송료를 입력해주세요.",
              })}
              type="number"
              maxLength={10}
              placeholder="숫자만 입력하세요"
              className="block w-full rounded-md border-0 px-2 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            />
            <div className="text-red-500 text-center mt-1">
              {errors.fareView?.message}
            </div>
          </div>

          {/* 버튼을 운송료 입력 바로 아래에 배치 */}
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
    </form>
  );
}
