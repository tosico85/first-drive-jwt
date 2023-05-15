import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import apiPaths from "../../services/apiRoutes";
import { requestServer } from "../../services/apiService";
import Seo from "../components/Seo";

export default function OrderRoutes({ params }) {
  const [route, param] = params || [];
  const router = useRouter();

  router.push(`/order/${route}`);
}

export async function getServerSideProps({ params: { params } }) {
  return {
    props: { params },
  };
}
