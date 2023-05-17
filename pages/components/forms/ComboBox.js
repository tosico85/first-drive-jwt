const ComboBox = ({ register, onChange, list, title, name }) => {
  return (
    <select
      {...register(name, {
        required: `${title}을(를) 입력해주세요`,
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
