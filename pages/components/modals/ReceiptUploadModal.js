import { useContext, useState } from "react";
import { useInput, useRadio } from "../../../hooks/useInput";
import apiPaths from "../../../services/apiRoutes";
import { isEmpty, isNumber } from "../../../utils/StringUtils";
import AuthContext from "../../context/authContext";
import Label from "../custom/Label";

const ReceiptUploadModal = ({ onCancel, onComplete, cargo_seq }) => {
  const { requestServer, userInfo } = useContext(AuthContext);
  const isAdmin = userInfo.auth_code === "ADMIN";

  //hooks
  const [selectedImage, setSelectedImage] = useState(null);
  const receiptAddCheck = useRadio(true);
  const receiptNotAddCheck = useRadio(false);

  /**
   * 이미지 선택
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  /**
   * 인수증 등록 버튼 click
   */
  const handleAddReceipt = async () => {
    let receipt_add_yn = "Y";
    if (receiptAddCheck.checked) {
      if (!selectedImage) {
        alert("업로드할 인수증(이미지)을 선택해주세요.");
        return false;
      }
    } else {
      if (!confirm("인수증을 미등록 하시겠습니까?")) {
        return false;
      } else {
        receipt_add_yn = "N";
      }
    }

    // 인수증 등록
    const { result, resultCd } = await requestServer(
      apiPaths.adminAddOrderReceipt,
      { cargo_seq, receipt_image: selectedImage, receipt_add_yn }
    );

    if (resultCd === "00") {
      if (receipt_add_yn == "Y") {
        alert("인수증이 업로드되었습니다.");
      } else {
        alert("인수증 미등록 처리하였습니다.");
      }
      onComplete();
    } else {
      alert(result);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex flex-col gap-y-5 h-full">
        <div className="pb-3 border-b border-gray-200">
          <p className="text-xl font-bold">인수증 등록</p>
        </div>
        <div className="grid grid-cols-2 gap-x-3">
          <div
            className={
              "flex justify-center gap-x-2 p-5 text-lg rounded-md border border-gray-300 " +
              (receiptAddCheck.checked && "text-blue-600 border-blue-600")
            }
            onClick={() => {
              receiptNotAddCheck.setChecked(false);
              receiptAddCheck.onClick();
            }}
          >
            <input
              type="checkbox"
              checked={receiptAddCheck.checked}
              onChange={() => {}}
            />
            <span>등록</span>
          </div>
          <div
            className={
              "flex justify-center gap-x-2 p-5 text-lg rounded-md border border-gray-300 " +
              (receiptNotAddCheck.checked && "text-blue-600 border-blue-600")
            }
            onClick={() => {
              setSelectedImage(null);
              receiptAddCheck.setChecked(false);
              receiptNotAddCheck.onClick();
            }}
          >
            <input
              type="checkbox"
              checked={receiptNotAddCheck.checked}
              onChange={() => {}}
            />
            <span>미등록</span>
          </div>
        </div>
        {receiptAddCheck.checked ? (
          <div className="h-full">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="bg-white border border-slate-100 rounded-md w-full"
            />
            <div className="py-5 h-full">
              {selectedImage ? (
                <div className="flex justify-center items-center h-full bg-slate-100  relative overflow-hidden">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center h-full bg-slate-100">
                  <span className="text-slate-500">인수증 이미지</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-slate-100 rounded-md flex justify-center items-center">
            <span className="text-slate-500">인수증 미등록 처리</span>
          </div>
        )}
      </div>
      <div className="text-center pt-5 grid grid-cols-2 w-full gap-x-3">
        <button
          type="button"
          className="rounded-md bg-normalGray px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-md bg-mainBlue px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mainColor2"
          onClick={handleAddReceipt}
        >
          인수증 등록
        </button>
      </div>
    </div>
  );
};

export default ReceiptUploadModal;
