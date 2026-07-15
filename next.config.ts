import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "instagram-backend-ea2y.onrender.com",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
