import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "instagram-backend-ea2y.onrender.com",
        pathname: "/images/**",
      },
      // Внешнее хранилище (Cloudinary): бэкенд теперь отдаёт в `images`/`imagesUrl`
      // готовый абсолютный URL вида https://res.cloudinary.com/<cloud>/image/upload/…
      // next/image оптимизирует картинку только с разрешённых хостов — без этого
      // паттерна фото с Cloudinary не отрисуются.
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
