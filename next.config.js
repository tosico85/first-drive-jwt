/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
