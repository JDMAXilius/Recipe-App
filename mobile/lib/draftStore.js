// Hand-off shelf between the Add sheet and the recipe editor. Route params
// can't carry a whole parsed recipe; this module-level slot can. One draft
// at a time — reading takes it (so stale drafts never leak into a later
// "Write it myself").

let draft = null;

export function setDraft(next) {
  draft = next;
}

export function takeDraft() {
  const d = draft;
  draft = null;
  return d;
}
