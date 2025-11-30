import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /node_modules\/thread-stream\/.*(?:README\.md|LICENSE|\.sh|test\/.*|ts\/.*)$/,
      use: "null-loader",
    });
    // Ignore test files and other non-module files in thread-stream
    config.ignoreWarnings = [/Failed to parse source map/];
    return config;
  },
};

export default nextConfig;
