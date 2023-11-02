import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html className="h-full bg-white">
        <Head>
          <meta
            name="naver-site-verification"
            content="56b96dbb3539b8bb0a2020f58511fca083c53d8d"
          />
        </Head>
        <body className="h-full w-full">
          <Main className="" />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
