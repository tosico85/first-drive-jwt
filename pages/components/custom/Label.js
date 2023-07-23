function Label({ title, required = false, width = "20" }) {
  return (
    <div
      className={`rounded-sm border shrink-0 border-gray-200 text-gray-500 h-9 py-2 pl-2 relative w-${width}`}
    >
      <span>{title}</span>
      {required && (
        <span className="text-red-500 absolute top-1 right-1 text-base">*</span>
      )}
    </div>
  );
}

export default Label;
