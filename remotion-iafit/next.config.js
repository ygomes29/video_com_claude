/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @remotion/renderer / @remotion/bundler are server-only Node packages whose
  // ESM bundles contain conditional platform-specific requires for native
  // compositor binaries (e.g. @remotion/compositor-win32-x64-msvc). Next's
  // bundler tries to resolve every branch statically and fails on the
  // platforms we are not running on. Keep them external so Node resolves them
  // at runtime instead.
  serverExternalPackages: [
    "@remotion/renderer",
    "@remotion/bundler",
    "@remotion/compositor",
    "@remotion/compositor-darwin-arm64",
    "@remotion/compositor-darwin-x64",
    "@remotion/compositor-linux-x64-gnu",
    "@remotion/compositor-linux-arm64-gnu",
    "@remotion/compositor-win32-x64-msvc",
    "@remotion/media-parser",
    "@remotion/web-renderer",
  ],
  // Turbopack config for Next.js 16+
  turbopack: {
    rules: {
      "*.md": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  // Webpack config for fallback
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      type: "asset/source",
    });
    return config;
  },
};

module.exports = nextConfig;
