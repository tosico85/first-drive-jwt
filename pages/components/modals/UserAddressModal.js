import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";

export default function UserAddressModal({ startEnd, onCancel, onComplete }) {
  const [addressList, setAddressList] = useState({});
  const { requestServer } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      const {
        result: { start, end },
      } = await requestServer(apiPaths.userAddressList, {});

      setAddressList(() => (startEnd === "start" ? start : end));
      //console.log(addressList);
    })();
  }, []);

  const handleSelect = (address) => {
    onComplete(address);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold leading-7">주소록</h2>
      <p className="mt-1 text-sm leading-6 mb-5 text-gray-600 dark:text-gray-300">
        최근 등록 주소 목록입니다.
      </p>
      <ul className="flex flex-col border-y border-slate-300">
        {addressList.length > 0 &&
          addressList.map(({ baseYn, wide, sgg, dong, detail }, index) => (
            <li
              key={index}
              className="grid grid-cols-10 justify-between items-center border-b border-slate-200 p-3 hover:bg-gray-100 hover:cursor-pointer"
              onClick={() => handleSelect({ baseYn, wide, sgg, dong, detail })}
            >
              <div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
              </div>
              <div className="flex flex-col p-5 text-sm col-span-7">
                <h2 className="font-semibold mb-2">
                  {`${wide} ${sgg} ${dong}`}
                </h2>
                <span>{detail}</span>
              </div>
              <div className={"col-span-2 text-xs flex justify-end"}>
                <p
                  className={
                    "font-bold w-fit h-fit px-1 py-1 rounded-full ring-2 " +
                    (baseYn == "Y"
                      ? "ring-indigo-400 text-indigo-400"
                      : "ring-gray-400 text-gray-400")
                  }
                >
                  {baseYn == "Y" ? "기본주소" : "최근주소"}
                </p>
              </div>
            </li>
          ))}
      </ul>
      <div className="mt-5 text-center">
        <button
          type="button"
          className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          onClick={onCancel}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
