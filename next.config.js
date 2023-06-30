const nextConfig = {
  env: {
    API_JUSO_URL: process.env.API_JUSO_URL,
    API_JUSO_KEY: process.env.API_JUSO_KEY,
  },

  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: "https://6corps.co.kr/:path*", // 프록시 대상 URL 설정
      },
    ];
  },
};

module.exports = nextConfig;
