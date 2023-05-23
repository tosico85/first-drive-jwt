import Link from "next/link";
import { useContext } from "react";
import AuthContext from "../context/authContext";
import { useRouter } from "next/router";

const Navbar = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const router = useRouter();

  const handleClick = (e) => {
    e.preventDefault();

    //console.log(">>>>>>>>>>>>>>", isAuthenticated);
    if (isAuthenticated) {
      router.push(e.target.href);
    } else {
      // 로그인이 필요한 경우 경고 메시지 출력 및 로그인 페이지로 리다이렉트
      alert("로그인이 필요합니다.");
      router.push("/login");
    }
  };
  return (
    <nav>
      <Link href="/">
        <a onClick={handleClick} className={`link`}>
          Home
        </a>
      </Link>
      {isAuthenticated ? (
        <Link href="">
          <a onClick={logout} className={`link`}>
            Logout
          </a>
        </Link>
      ) : (
        <Link href="/login">
          <a className={`link`}>Login</a>
        </Link>
      )}
    </nav>
  );
};

export default Navbar;
