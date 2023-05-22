import { useEffect, useState } from "react";

const ComboBox = ({ onComboChange, list, selectedValue, title }) => {
  const [comboValue, setComboValue] = useState("");
  const [comboList, setComboList] = useState([]);

  useEffect(() => {
    setComboValue(selectedValue);
    setComboList(list);
  }, []);

  return (
    <select onChange={onComboChange}>
      <option value="">{title}</option>
      {comboList.map((item, i) => (
        <option key={i} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
};

export default ComboBox;
