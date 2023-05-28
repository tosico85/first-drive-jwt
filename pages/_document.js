import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html className="h-full bg-white dark:bg-gray-800">
        <Head />
        <body className="h-full w-full dark dark:bg-gray-800">
          <Main className="" />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
