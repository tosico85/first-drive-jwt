import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import AuthContext from "./context/authContext";

const LoginPage = () => {
  const [mode, setMode] = useState("login");
  const { login, join } = useContext(AuthContext);
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

  const onValid = async () => {
    //login()
    const email = getValues("email");
    const password = getValues("password");

    if (mode === "login") {
      const { resultCd, result } = await login(email, password);
      if (resultCd != "00") {
        setError("submitError", {
          type: "manual",
          message: "이메일 또는 패스워드가 일치하지 않습니다.",
        });

        console.log(errors);
      } else {
      }
    } else {
      const name = getValues("name");
      const { resultCd, result } = await join(name, email, password);
      if (resultCd !== "00") {
        setError("submitError", { message: result });
      } else {
        reset();
        toggleMode();
      }
    }
  };

  const oninvalid = (error) => {
    console.log("Error state : ", error);
  };

  const toggleMode = () => {
    setMode((mode) => (mode == "login" ? "join" : "login"));
    reset();
  };

  return (
    <>
      <h1>{mode === "login" ? "로그인" : "회원가입"}</h1>
      <form onSubmit={handleSubmit(onValid, oninvalid)}>
        {mode === "join" && (
          <div>
            <input
              {...register("name", {
                required: "이름을 입력해주세요.",
                onChange: () => {
                  clearErrors();
                },
              })}
              type="text"
              placeholder="Name"
            />
            {errors.name?.message}
          </div>
        )}
        <div>
          <input
            {...register("email", { required: "이메일을 입력해주세요." })}
            type="email"
            placeholder="Email"
          />
          {errors.email?.message}
        </div>
        <div>
          <input
            {...register("password", {
              required: "패스워드를 입력해주세요.",
              onChange: () => {
                clearErrors();
              },
            })}
            type="password"
            placeholder="Password"
          />
          {errors.password?.message}
        </div>
        <div>
          <input
            type="submit"
            value={mode === "login" ? "로그인" : "회원가입"}
          ></input>
        </div>
        {errors.submitError?.message}
      </form>
      <div>
        <p onClick={toggleMode}>
          {mode === "login" ? "회원 가입하기" : "로그인"}
        </p>
      </div>
    </>
  );
};

export default LoginPage;
