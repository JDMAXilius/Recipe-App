module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // MUST be last — the worklet transform. Reanimated 4 moved this to
    // react-native-worklets/plugin (the old react-native-reanimated/plugin
    // throws "Exception in HostFunction" at runtime). Without it the whole feel
    // layer (springs, breathing, count-up) crashes on native (contract: P0).
    plugins: ['react-native-worklets/plugin'],
  };
};
