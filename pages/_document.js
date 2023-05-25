import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html className="h-full bg-gray-100 dark:bg-gray-800">
        <Head />
        <body className="h-max dark dark:bg-gray-800 dark:text-gray-100">
          <Main className="" />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
