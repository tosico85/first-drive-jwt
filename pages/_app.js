import React, { useState, useEffect } from "react";
import App from "next/app";
import { AuthProvider } from "./context/authContext";
import Layout from "./components/Layout";
import "../styles/globals.css";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "react-modal";
import loadingGif from "./loading.gif"; // GIF 이미지 파일 경로를 적절하게 수정

// Set app element for react-modal
Modal.setAppElement("#__next");

class MyApp extends App {
  state = {
    isLoading: true, // 초기에 로딩 중 상태
  };

  async componentDidMount() {
    // 데이터를 비동기로 불러오는 작업 예시
    // 이 예시에서는 2초 후에 로딩 상태를 false로 변경
    setTimeout(() => {
      this.setState({ isLoading: false });
    }, 2000);
  }

  render() {
    const { Component, pageProps } = this.props;
    const { isLoading } = this.state;

    return (
      <AuthProvider>
        <Layout>
          {isLoading ? (
            // 로딩 중일 때 GIF 이미지를 표시하고 가운데 정렬
            <div className="h-screen flex items-center justify-center bg-black bg-opacity-0 fixed top-100 left-0 right-0 bottom-0 z-50 md:hidden">
              <img
                src="/cars/loading_13.gif"
                alt="Loading GIF"
                className="w-40 h-40 object-contain"
              />
            </div>
          ) : (
            // 로딩이 끝나면 페이지 컴포넌트를 표시
            <Component {...pageProps} />
          )}
        </Layout>
      </AuthProvider>
    );
  }
}

export default MyApp;
