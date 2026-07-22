// Test-runner resolve hook (wired via --import in the root "test" script).
// The engine's TS modules import each other extensionless — that is what tsc
// accepts without allowImportingTsExtensions — but node's ESM loader needs an
// extension. Retry relative misses with ".ts" appended. Runtime-neutral for
// the app: Metro never sees this file; only `node --test` loads it.
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if ((specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[a-z]+$/i.test(specifier)) {
        try {
          return nextResolve(`${specifier}.ts`, context);
        } catch {
          throw err;
        }
      }
      throw err;
    }
  },
});
