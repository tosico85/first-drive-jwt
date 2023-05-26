import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html className="h-full bg-white dark:bg-gray-800 font-sans">
        <Head />
        <body className="h-full dark dark:bg-gray-800 dark:text-gray-100">
          <Main className="h-full" />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
