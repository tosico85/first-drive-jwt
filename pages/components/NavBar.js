import Link from "next/link";
import { useContext } from "react";
import AuthContext from "../context/authContext";
import { useRouter } from "next/router";

const Navbar = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const router = useRouter();

  return (
    <nav>
      <Link href="/">
        <a className={`link ${router.pathname === "/" ? "active" : ""}`}>
          Home
        </a>
      </Link>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <Link href="/login">
          <a>Login</a>
        </Link>
      )}
    </nav>
  );
};

export default Navbar;
