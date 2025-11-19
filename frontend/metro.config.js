// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for react-native-webrtc module resolution issues
// This allows Metro to resolve packages that use subpath exports
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
};

module.exports = config;

