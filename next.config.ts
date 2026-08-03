import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // src/middleware.ts matches the upload routes, so Next buffers the request body
    // to let both the middleware and the route handler read it. The default cap is
    // 10MB, past which the handler only sees a partial body and formData() throws a
    // misleading parse error. Kept comfortably above the upload-pdf size check so
    // oversized files get that route's clear 413 instead.
    proxyClientMaxBodySize: "50mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
