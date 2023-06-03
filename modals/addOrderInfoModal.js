import React, { useState } from "react";

const AddOrderInfoModal = ({ onClose }) => {
  return (
    <div className="fixed top-32 left-0 w-full h-full inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded p-8 relative">
        <h2 className="text-xl font-bold mb-4">모달 제목</h2>
        <p>모달 내용입니다.</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default AddOrderInfoModal;
