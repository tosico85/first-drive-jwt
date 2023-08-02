import { useContext, useEffect, useState } from "react";
import Label from "../custom/Label";
import AuthContext from "../../context/authContext";
import apiPaths from "../../../services/apiRoutes";
import StartEndAddress from "../mixins/startEndAddress";

const FareInputModal = ({ selectedFare, onCancel, onComplete }) => {
  const { requestServer } = useContext(AuthContext);
  const [startAddr, setStartAddr] = useState({
    wide: selectedFare.startWide,
    sgg: selectedFare.startSgg,
  });
  const [endAddr, setEndAddr] = useState({
    wide: selectedFare.endWide,
    sgg: selectedFare.endSgg,
  });

  useEffect(() => {
    console.log("startAddr", startAddr);
    console.log("endAddr", endAddr);
  }, [startAddr, endAddr]);

  return (
    <div className="p-5 flex flex-col gap-y-3">
      <p>요금 입력</p>
      <div className="flex flex-col gap-y-3">
        <div className="flex items-center gap-x-3">
          <Label title={"상차지"} required={true} />
          <StartEndAddress paramValue={startAddr} setValue={setStartAddr} />
        </div>
        <div className="flex items-center gap-x-3">
          <Label title={"하차지"} required={true} />
          <StartEndAddress paramValue={endAddr} setValue={setEndAddr} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center">
            <Label title={"1톤"} required={true} />
            <Label title={"2.5톤"} required={true} />
            <Label title={"3.5톤"} required={true} />
            <Label title={"5톤"} required={true} />
            <Label title={"5톤축"} required={true} />
            <Label title={"11톤"} required={true} />
            <Label title={"18톤"} required={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FareInputModal;
