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
      <div className="flex flex-col w-full max-w-md px-4 py-8 bg-white rounded-lg shadow sm:px-6 md:px-8 lg:px-10 mx-auto">
        {mode === "login" ? (
          <div className="self-center mb-6 text-xl font-light text-gray-600 sm:text-2xl">
            Login To Your Account
          </div>
        ) : (
          <>
            <div className="self-center mb-2 text-xl font-light text-mainColor1 sm:text-2xl">
              Create a new account
            </div>
            <span className="justify-center text-sm text-center text-gray-500 flex-items-center">
              Already have an account ?
              <a
                href="#"
                onClick={toggleMode}
                target="_blank"
                className="text-sm text-blue-500 underline hover:text-blue-700"
              >
                Sign in
              </a>
            </span>
          </>
        )}

        <div className="mt-8">
          <form
            action="#"
            autoComplete="off"
            onSubmit={handleSubmit(onValid, oninvalid)}
          >
            {mode === "join" && (
              <div className="flex flex-col mb-2">
                <div className="flex relative ">
                  <span className="rounded-l-md inline-flex  items-center px-3 border-t bg-white border-l border-b  border-gray-300 text-gray-500 shadow-sm text-sm">
                    <svg
                      width="15"
                      height="15"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        clipRule="evenodd"
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z"
                      />
                    </svg>
                  </span>
                  <input
                    {...register("name", {
                      required: "이름을 입력해주세요.",
                      onChange: () => {
                        clearErrors();
                      },
                    })}
                    type="text"
                    className="rounded-r-lg flex-1 appearance-none border border-gray-300 w-full py-2 px-4 bg-white text-gray-700 placeholder-gray-400 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div className="text-red-500 text-sm text-end">
                  {errors.name?.message}
                </div>
              </div>
            )}
            <div className="flex flex-col mb-2">
              <div className="flex relative ">
                <span className="rounded-l-md inline-flex  items-center px-3 border-t bg-white border-l border-b  border-gray-300 text-gray-500 shadow-sm text-sm">
                  <svg
                    width="15"
                    height="15"
                    fill="currentColor"
                    viewBox="0 0 1792 1792"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M1792 710v794q0 66-47 113t-113 47h-1472q-66 0-113-47t-47-113v-794q44 49 101 87 362 246 497 345 57 42 92.5 65.5t94.5 48 110 24.5h2q51 0 110-24.5t94.5-48 92.5-65.5q170-123 498-345 57-39 100-87zm0-294q0 79-49 151t-122 123q-376 261-468 325-10 7-42.5 30.5t-54 38-52 32.5-57.5 27-50 9h-2q-23 0-50-9t-57.5-27-52-32.5-54-38-42.5-30.5q-91-64-262-182.5t-205-142.5q-62-42-117-115.5t-55-136.5q0-78 41.5-130t118.5-52h1472q65 0 112.5 47t47.5 113z"></path>
                  </svg>
                </span>
                <input
                  {...register("email", {
                    required: "이메일을 입력해주세요.",
                    onChange: () => {
                      clearErrors();
                    },
                  })}
                  type="email"
                  className=" rounded-r-lg flex-1 appearance-none border border-gray-300 w-full py-2 px-4 bg-white text-gray-700 placeholder-gray-400 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Your email"
                />
              </div>
              <div className="text-red-500 text-sm text-end">
                {errors.email?.message}
              </div>
            </div>
            <div className="flex flex-col mb-6">
              <div className="flex relative ">
                <span className="rounded-l-md inline-flex  items-center px-3 border-t bg-white border-l border-b  border-gray-300 text-gray-500 shadow-sm text-sm">
                  <svg
                    width="15"
                    height="15"
                    fill="currentColor"
                    viewBox="0 0 1792 1792"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M1376 768q40 0 68 28t28 68v576q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-576q0-40 28-68t68-28h32v-320q0-185 131.5-316.5t316.5-131.5 316.5 131.5 131.5 316.5q0 26-19 45t-45 19h-64q-26 0-45-19t-19-45q0-106-75-181t-181-75-181 75-75 181v320h736z"></path>
                  </svg>
                </span>
                <input
                  {...register("password", {
                    required: "패스워드를 입력해주세요.",
                    onChange: () => {
                      clearErrors();
                    },
                  })}
                  type="password"
                  className=" rounded-r-lg flex-1 appearance-none border border-gray-300 w-full py-2 px-4 bg-white text-gray-700 placeholder-gray-400 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Your password"
                />
              </div>
              <div className="text-red-500 text-sm text-end">
                {errors.password?.message}
              </div>
            </div>
            {mode === "login" && (
              <div className="flex items-center mb-6 -mt-4">
                <div className="flex ml-auto">
                  <a
                    href="#"
                    className="inline-flex text-xs font-thin text-gray-500 sm:text-sm hover:text-gray-700"
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
                className="py-2 px-4  bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 focus:ring-offset-purple-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg "
              >
                {mode === "login" ? "Login" : "Join"}
              </button>
            </div>
          </form>
        </div>
        {mode === "login" && (
          <div className="flex items-center justify-center mt-6">
            <a
              href="#"
              onClick={toggleMode}
              target="_blank"
              className="inline-flex items-center text-xs font-thin text-center text-gray-500 hover:text-gray-700"
            >
              <span className="ml-2">You don&#x27;t have an account?</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
