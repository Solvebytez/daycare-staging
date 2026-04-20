import type { NextConfig } from "next";
import { readEnvVarFromDisk, readPublishableKeyFromDisk } from "./next-env-stripe";

const stripePublishableKey = readPublishableKeyFromDisk();
const apiUrl = readEnvVarFromDisk("NEXT_PUBLIC_API_URL");

const nextConfig: NextConfig = {
  // Use server-side rendering for dynamic routes
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion']
  },
  // Enable compression
  compress: true,
  // Enable React strict mode for better performance
  reactStrictMode: true,
  // Disable server-side features for static export
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  // Ensure NEXT_PUBLIC_* is available even when dotenv injection to Route Handlers fails
  env: {
    ...(stripePublishableKey
      ? { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: stripePublishableKey }
      : {}),
    ...(apiUrl ? { NEXT_PUBLIC_API_URL: apiUrl } : {}),
  },
};

export default nextConfig;
