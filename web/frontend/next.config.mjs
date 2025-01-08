/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend",
        destination:
          "https://self-register-safe-pickup-production.up.railway.app/api",
      },
    ];
  },
};

export default nextConfig;
