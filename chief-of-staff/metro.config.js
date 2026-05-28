const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

/**
 * Block server-only Node.js packages from being included in the native bundle.
 * These packages use Node.js APIs (grpc, http2, fs, net) that crash React Native.
 * They are only used by the Express/tRPC server, never by the mobile client.
 */
const SERVER_ONLY_MODULES = [
  "@google-cloud/text-to-speech",
  "@grpc/grpc-js",
  "@grpc/proto-loader",
  "google-auth-library",
  "google-gax",
  "grpc",
  "express",
  "drizzle-kit",
  "mysql2",
  "tsx",
  "esbuild",
];

config.resolver = config.resolver ?? {};
config.resolver.blockList = [
  // Block server directory from being bundled into the native app
  /\/server\/_core\//,
  /\/server\/db\.ts/,
  /\/server\/storage\.ts/,
  // Block server-only node_modules
  ...SERVER_ONLY_MODULES.map(
    (pkg) => new RegExp(`node_modules[\\/]${pkg.replace("/", "[\\/]")}[\\/]`)
  ),
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
];

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
