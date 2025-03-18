/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['bcrypt'],
  },
  transpilePackages: ['next-auth'],
};

module.exports = nextConfig; 