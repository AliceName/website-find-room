import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Thêm dòng này để cho phép ảnh từ Unsplash
      },
      {
        protocol: "https",
        hostname: "koxwdeaudncnyfzhbnmi.supabase.co", // Hostname Supabase của Nga
      },
    ],
  },
};

export default nextConfig;
