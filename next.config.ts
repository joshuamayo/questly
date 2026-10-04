import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Database drivers load native/WASM assets at runtime; keep them out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
