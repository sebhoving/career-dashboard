import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Ship only the chart code that is actually imported.
    optimizePackageImports: ["recharts", "lucide-react", "date-fns"],
  },
};

export default nextConfig;
