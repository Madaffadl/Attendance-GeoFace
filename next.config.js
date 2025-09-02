/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  target: 'server',  // (optional) Add this if needed
};

module.exports = nextConfig;
