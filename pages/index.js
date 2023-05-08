import Seo from "./components/Seo";
import Link from "next/link";
import axios from "axios";

export default function Home({ results }) {
  const [movies, setMovies] = useState(results);

  useEffect(() => {
    (async () => {
      const json = await (await fetch("/user/join")).json();
      setMovies(json.results);
    })();
  }, []);

  return (
    <div>
      <Seo title="Home" />
      <h1>Hello</h1>
      <div>
        {results.map((item) => (
          <div key={item.id}>
            <span>
              <Link
                href={{
                  pathname: `/movies/${item.original_title}/${item.id}`,
                }}
              >
                <a>{item.original_title}</a>
              </Link>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const requestUrl = "https://www.6corps.co.kr/user/join";
  const requestParameter = {
    email: "test123@gmail.com",
    password: "abc123",
    name: "김튼튼",
  };
  const result = await axios({
    method: "post",
    url: requestUrl,
    data: JSON.stringify(requestParameter),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
    },
  });

  console.log(result);
  return {
    props: {
      result,
    },
  };
}
