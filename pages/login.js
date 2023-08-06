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
      if (resultCd != "00" && resultCd != "01") {
        setError("submitError", {
          type: "manual",
          message: result,
        });

        console.log(errors);
      } else {
      }
    } else {
      const name = getValues("name");
      const { resultCd, result } = await join(name, email, password);
      if (resultCd !== "00") {
        if (resultCd === "99") {
          setError("submitError", {
            type: "manual",
            message: "이미 가입된 계정입니다.",
          });
        } else {
          setError("submitError", { message: result });
        }
      } else {
        alert("회원 가입 신청되었습니다. 관리자 승인 후 이용 가능합니다.");
        reset();
        toggleMode();
      }
    }
  };

  const oninvalid = (error) => {
    console.log("Error state : ", error);
  };

  const toggleMode = (e) => {
    e?.preventDefault();
    setMode((mode) => (mode == "login" ? "join" : "login"));
    reset();
  };

  return (
    <div className="h-full flex items-center bg-white">
      <div className="relative flex flex-col w-full max-w-md px-4 py-8 bg-white rounded-md shadow mx-auto">
        <div className="absolute top-0 left-0 w-full p-5 rounded-t-md text-white bg-black">
          <p className="font-extrabold text-xl lg:text-2xl">간편접수 로그인</p>
          <p className="text-sm mt-2">
            365일 24시간 언제 어디서든 화물을 접수하세요!!
          </p>
        </div>

        <div className="mt-24">
          <form
            action="#"
            autoComplete="off"
            onSubmit={handleSubmit(onValid, oninvalid)}
          >
            {mode === "join" && (
              <div className="flex flex-col mb-5">
                <p className="text-sm">이름</p>
                <div className="flex relative ">
                  <input
                    {...register("name", {
                      required: "이름을 입력해주세요.",
                      onChange: () => {
                        clearErrors();
                      },
                    })}
                    type="text"
                    className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div className="text-red-500 text-sm text-end">
                  {errors.name?.message}
                </div>
              </div>
            )}
            <div className="flex flex-col mb-5">
              <p className="text-sm">이메일</p>
              <div className="flex relative ">
                <input
                  {...register("email", {
                    required: "이메일을 입력해주세요.",
                    onChange: () => {
                      clearErrors();
                    },
                  })}
                  type="email"
                  className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                  placeholder="이메일을 입력하세요"
                />
              </div>
              <div className="text-red-500 text-sm text-end">
                {errors.email?.message}
              </div>
            </div>
            <div className="flex flex-col mb-6">
              <p className="text-sm">비밀번호</p>
              <div className="flex relative ">
                <input
                  {...register("password", {
                    required: "비밀번호를 입력해주세요.",
                    onChange: () => {
                      clearErrors();
                    },
                  })}
                  type="password"
                  className="block w-full rounded-sm border-0 px-2 py-1.5 shadow-sm placeholder:text-gray-400 bg-mainInputColor focus:bg-mainInputFocusColor outline-none"
                  placeholder="비밀번호를 입력하세요."
                />
              </div>
              <div className="text-red-500 text-sm text-end">
                {errors.password?.message}
              </div>
            </div>
            {mode === "login" && (
              <div className=" items-center mb-6 -mt-4 hidden">
                <div className="flex ml-auto">
                  <a
                    href="#"
                    className="inline-flex text-xs font-thin text-gray-500 lg:text-sm hover:text-gray-700"
                  >
                    Forgot Your Password?
                  </a>
                </div>
              </div>
            )}
            <div className="text-red-500 mx-auto mb-6 font-bold text-center">
              {errors.submitError?.message}
            </div>
            <div className="flex w-full">
              <button
                type="submit"
                onClick={() => {
                  clearErrors();
                }}
                className="py-2 px-4  bg-mainBlue hover:bg-blue-700 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-md "
              >
                {mode === "login" ? "Login" : "Join"}
              </button>
            </div>
          </form>
        </div>
        {mode === "login" ? (
          <div className="flex items-center justify-center mt-6">
            <a
              href="#"
              onClick={toggleMode}
              target="_blank"
              className="inline-flex items-center text-xs font-thin text-center text-gray-500 hover:text-gray-700"
            >
              <span className="ml-2">회원가입</span>
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-center mt-6">
            <a
              href="#"
              onClick={toggleMode}
              target="_blank"
              className="inline-flex items-center text-xs font-thin text-center text-gray-500 hover:text-gray-700"
            >
              <span className="ml-2">로그인</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
