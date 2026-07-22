// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // v1 trees keep their own configs; this one covers only the v2 app.
    ignores: ['mobile/**', 'backend/**', 'node_modules/**', 'dist/**', '.expo/**'],
  },
]);
