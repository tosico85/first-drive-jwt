import React from "react";
import App from "next/app";
import { AuthProvider } from "./context/authContext";
import Layout from "./components/Layout";
import "../styles/globals.css";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "react-modal";

// Set app element for react-modal
Modal.setAppElement("#__next");

class MyApp extends App {
  static async getInitialProps({ Component, ctx }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }

    return { pageProps };
  }

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
