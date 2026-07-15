// Tiny event bus so Otto can react to app events (D4 "interactive" layer,
// done in code). Emitters: PawMark ("save"). Listeners: OttoIdle instances
// with a `reactTo` prop. Deliberately dumb — no payloads, no history.

const listeners = new Set();

export const ottoBus = {
  emit(event) {
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // a broken listener never breaks the emitter
      }
    });
  },
  on(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
