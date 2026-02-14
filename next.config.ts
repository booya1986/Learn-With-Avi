import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
    ],
  },
  // Set explicit workspace root for output file tracing
  outputFileTracingRoot: path.resolve(__dirname),

  // Webpack configuration for stable module resolution
  webpack: (config) => {
    // Ensure proper module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin/blob/master/src/index.ts#L29

  org: process.env.SENTRY_ORG || '',
  project: process.env.SENTRY_PROJECT || '',

  // Only print logs for uploading source maps related warnings
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Enables the Release Health feature
  release: process.env.SENTRY_RELEASE,

  // Suppress warnings since we're using proper instrumentation files
  suppressConsoleLogs: true,
  skipSourceMapUpload: !process.env.SENTRY_AUTH_TOKEN,
});
