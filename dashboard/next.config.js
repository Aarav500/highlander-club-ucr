/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    LAB_API_URL: process.env.LAB_API_URL || "http://localhost:8100",
    API_NODE_URL: process.env.API_NODE_URL || "http://localhost:4000",
  },
};

module.exports = nextConfig;
