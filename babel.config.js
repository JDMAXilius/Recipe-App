module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // MUST be last — reanimated's worklet transform. Without it the whole feel
    // layer (springs, breathing, count-up) silently no-ops (contract: P0).
    plugins: ['react-native-reanimated/plugin'],
  };
};
