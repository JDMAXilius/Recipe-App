// OttoBus — a tiny typed app-event emitter (contract: ui-components.md §5).
// Decouples cross-cutting reactions from the code that triggers them: PawMark
// emits 'save'; every OttoIdle with reactTo="save" hops. Event vocabulary grows
// by contract only.
type OttoEvent = 'save';
type Handler = () => void;

const handlers: Record<OttoEvent, Set<Handler>> = { save: new Set() };

export const ottoBus = {
  on(event: OttoEvent, fn: Handler): () => void {
    handlers[event].add(fn);
    return () => handlers[event].delete(fn);
  },
  emit(event: OttoEvent): void {
    // copy before iterating — a handler may unsubscribe mid-emit
    for (const fn of [...handlers[event]]) fn();
  },
};
