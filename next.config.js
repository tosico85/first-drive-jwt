/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  assetPrefix: process.env.NODE_ENV === "production" ? "/tosico85" : "",
  async rewrites() {
    return [
      /* {
        source: "/(.*)",
        destination: "https://localhost:443/$1",
      }, */
    ];
  },
};

module.exports = nextConfig;
