import { useEffect } from "react";
import "../styles/globals.css";
import Layout from "./components/Layout";
import { AuthProvider } from "./context/authContext";

function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

export default App;
