/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    API_JUSO_URL: process.env.API_JUSO_URL,
    API_JUSO_KEY: process.env.API_JUSO_KEY,
  },
};

module.exports = nextConfig;
