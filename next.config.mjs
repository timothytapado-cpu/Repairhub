import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a second dev server run side by side with its own build folder (NEXT_DIST_DIR=.next-alt).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Product photos and permit files are uploaded through server actions (default limit is 1 MB).
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  // Explicit alias so "@/..." resolves regardless of tsconfig handling on Windows.
  webpack: (config) => {
    config.resolve.alias["@"] = path.join(root, "src");
    return config;
  },
};
export default nextConfig;
