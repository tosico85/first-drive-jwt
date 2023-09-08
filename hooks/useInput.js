import { useState } from "react";

export const useInput = (initialValue, type = "text") => {
  const [value, setValue] = useState(initialValue);
  const onChange = (event) => {
    const {
      target: { value },
    } = event;

    // 숫자 필드인 경우 필터링
    if (type == "number") {
      setValue(value.replace(/[^0-9]/g, ""));
    } else if (type == "float") {
      setValue(value.replace(/[^0-9.]/g, ""));
    } else {
      setValue(value);
    }
  };
  return { value, onChange };
};

export const useRadio = (initialValue) => {
  const [checked, setChecked] = useState(initialValue);
  const onClick = (e) => {
    setChecked(true);
  };
  return { checked, onClick, setChecked };
};
