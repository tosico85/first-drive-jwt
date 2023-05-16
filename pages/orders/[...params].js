import { useRouter } from "next/router";
import { useEffect } from "react";

export default function OrderRoutes({ params }) {
  const [route, param] = params || [];
  const router = useRouter();

  useEffect(() => {
    router.push({
      pathname: `/orders/${route}`,
      query: { param },
    });
  }, []);

  return null;
}

export async function getServerSideProps({ params: { params } }) {
  return {
    props: { params },
  };
}
