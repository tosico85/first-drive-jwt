import React from "react";
import App from "next/app";
import { AuthProvider } from "./context/authContext";
import Layout from "./components/Layout";
import "../styles/globals.css";
import "react-datepicker/dist/react-datepicker.css";

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <AuthProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthProvider>
    );
  }
}

export default MyApp;
