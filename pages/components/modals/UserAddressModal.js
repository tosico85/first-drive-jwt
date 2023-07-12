import { useContext, useEffect, useState } from "react";
import apiPaths from "../../../services/apiRoutes";
import AuthContext from "../../context/authContext";

export default function UserAddressModal({ startEnd, onCancel, onComplete }) {
  const [addressList, setAddressList] = useState({});
  const { requestServer } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      await selectList();
    })();
  }, [startEnd]);

  const selectList = async () => {
    const {
      result: { start, end },
    } = await requestServer(apiPaths.userAddressList, {});

    start.forEach((address, index) => {
      address["checked"] = address.baseYn == "Y";
      address["key"] = index;
    });

    end.forEach((address, index) => {
      address["checked"] = address.baseYn == "Y";
      address["key"] = index;
    });
    setAddressList(() => (startEnd === "start" ? start : end));
  };

  const handleDelete = async (address) => {
    const params = { ...address, startEnd };
    const { result, resultCd } = await requestServer(
      apiPaths.userAddressDel,
      params
    );

    if (resultCd === "00") {
      alert("삭제되었습니다.");
      await selectList();
    } else {
      alert(result);
    }
  };

  const handleBase = async (address) => {
    const params = { ...address, startEnd, baseYn: "Y" };
    const { result, resultCd } = await requestServer(
      apiPaths.userAddressAdd,
      params
    );

    if (resultCd === "00") {
      alert("기본주소가 변경되었습니다.");
      await selectList();
    } else {
      alert(result);
    }
  };

  const handleChecked = (key) => {
    const list = [...addressList];
    list.forEach((item) => {
      if (item.key == key) {
        item.checked = !item.checked;
      } else {
        item.checked = false;
      }
    });
    //console.log(list);
    setAddressList(list);
  };

  const handleSelect = () => {
    const address = addressList.find((item) => item.checked == true);
    if (!address) {
      alert("주소를 선택해주세요.");
      return;
    }
    onComplete(address);
  };

  return (
    <div className="">
      <h2 className="text-lg font-semibold leading-7">주소록</h2>
      <p className="mt-1 text-sm leading-6 mb-5 text-gray-600">
        최근 등록 주소 목록입니다.
      </p>
      <div className="max-h-96 overflow-y-scroll">
        <ul className="flex flex-col border-y border-slate-300">
          {addressList.length > 0 &&
            addressList.map(
              ({ baseYn, wide, sgg, dong, detail, checked, key }, index) => (
                <li
                  key={index}
                  className="flex items-center border-b border-slate-200 py-1 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center gap-y-3 min-w-fit">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      checked={checked}
                      onClick={() => handleChecked(key)}
                      onChange={() => {}}
                    />
                    <p
                      className={
                        "font-bold text-xs min-w-fit h-fit px-1 py-1 rounded-md " +
                        (baseYn == "Y" ? " text-indigo-400" : " text-gray-400")
                      }
                    >
                      {baseYn == "Y" ? "기본" : "최근"}
                    </p>
                  </div>
                  <div className="flex flex-col items-start w-full">
                    <div
                      className="flex flex-col p-3 text-sm col-span-7 hover:cursor-pointer"
                      onClick={() => handleChecked(key)}
                    >
                      <h2 className="font-semibold mb-2">
                        {`${wide} ${sgg} ${dong}`}
                      </h2>
                      <span>{detail}</span>
                    </div>

                    {baseYn != "Y" && (
                      <div className="flex justify-end text-xs font-semibold text-gray-400 w-full hover:cursor-pointer">
                        <span
                          className="mr-3"
                          onClick={() =>
                            handleDelete({ wide, sgg, dong, detail })
                          }
                        >
                          삭제
                        </span>
                        <span
                          onClick={() =>
                            handleBase({ wide, sgg, dong, detail })
                          }
                        >
                          기본
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              )
            )}
        </ul>
      </div>
      <div className="mt-5 text-center py-5">
        <button
          type="button"
          className="rounded-md bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          onClick={handleSelect}
        >
          선택
        </button>
        <button
          type="button"
          className="ml-3 rounded-md bg-gray-400 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          onClick={onCancel}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
