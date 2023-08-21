const ComboBox = ({ onComboChange, list, selectedValue, title }) => {
  const handleChange = (e) => {
    const {
      target: { value },
    } = e;

    onComboChange(value);
  };

  return (
    <select
      className="rounded-md text-center text-lgz border-0 px-5 py-3 bg-slate-100"
      value={selectedValue}
      onChange={handleChange}
    >
      <option value={-1}>{title}</option>
      {list.map((item, i) => (
        <option key={i} value={item.value}>
          {item.name}
        </option>
      ))}
    </select>
  );
};

export default ComboBox;
