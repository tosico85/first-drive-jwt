/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    API_JUSO_URL: process.env.API_JUSO_URL,
    API_JUSO_KEY: process.env.API_JUSO_KEY,
  },

  async headers() {
    return [
      {
        // matching all API routes
        source: "/user/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
