import { useState } from "react";

export const useInput = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  const onChange = (event) => {
    const {
      target: { value },
    } = event;

    setValue(value);
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
