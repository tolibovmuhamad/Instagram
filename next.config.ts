import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "instagram-api.softclub.tj",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
