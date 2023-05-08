import Link from "next/link";
import { useRouter } from "next/router";

export default function NavBar() {
  const router = useRouter();

  return (
    <nav>
      <Link href="/">
        <a className={`link ${router.pathname === "/" ? "active" : ""}`}>
          Home
        </a>
      </Link>
      <Link href="/about">
        <a className={`link ${router.pathname === "/about" ? "active" : ""}`}>
          About
        </a>
      </Link>
    </nav>
  );
}
