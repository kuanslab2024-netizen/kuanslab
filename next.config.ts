import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/kuanslab",
  assetPrefix: "/kuanslab/",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
