import { useFormContext } from "react-hook-form";

const ComboBox = ({ onChange, list, title, name, essentialYn = true }) => {
  const { register } = useFormContext();

  return (
    <select
      {...register(name, {
        required: essentialYn ? `${title}을(를) 입력해주세요` : false,
        onChange,
      })}
    >
      <option value="">{title}</option>
      {list.map((item, i) => (
        <option key={i} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
};

export default ComboBox;
