import { useForm } from "react-hook-form";
import Seo from "../components/Seo";

export default function OrderCreate() {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    getValues,
    reset,
    resetField,
    formState: { errors },
  } = useForm({ mode: "onSubmit" });

  return (
    <div>
      <Seo title="화물 등록" />
      <h1>화물 등록</h1>
    </div>
  );
}
