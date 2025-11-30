import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /node_modules\/thread-stream\/.*(?:README\.md|LICENSE|\.sh|test\/.*|ts\/.*)$/,
      use: "null-loader",
    });
    return config;
  },
};

export default nextConfig;
