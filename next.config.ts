import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "koxwdeaudncnyfzhbnmi.supabase.co",
      },
      {
        protocol: "https",
        hostname: "www.pexels.com",
      },
    ],
  },
};

export default nextConfig;
