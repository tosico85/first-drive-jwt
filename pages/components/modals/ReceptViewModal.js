import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";

const ReceiptViewModal = ({ onCancel, cargo_seq }) => {
  const { requestServer } = useContext(AuthContext);
  const [receiptImage, setReceiptImage] = useState("");

  useEffect(() => {
    (async () => {
      await getReceiptImage();
    })();
  }, []);

  const getReceiptImage = async () => {
    // 인수증 등록
    const { receipt_image } = await requestServer(
      apiPaths.custReqGetOrderReceipt,
      {
        cargo_seq,
      }
    );

    if (receipt_image) {
      setReceiptImage(receipt_image);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex flex-col gap-y-5 h-full">
        <div className="flex justify-center items-center h-full bg-slate-100 relative overflow-hidden">
          <img
            src={`data:image/png;base64,${receiptImage.replace(
              "dataimage/jpegbase64",
              ""
            )}`}
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
      </div>
      <div className="text-center pt-5 grid w-full gap-x-3">
        <button
          type="button"
          className="rounded-md bg-normalGray px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          onClick={onCancel}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default ReceiptViewModal;
