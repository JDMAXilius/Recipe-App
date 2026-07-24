// Draft state for the ＋ flow — pure logic, zero framework imports so
// node --test can strip-type it directly (draft.test.mjs).
//
// Two jobs:
//  1. The hand-off shelf between AddSheet and EditRecipeScreen. Route params
//     can't carry a whole parsed recipe; this module-level slot can. One draft
//     at a time — reading TAKES it, so a stale import never leaks into a later
//     "Write it myself" (ported from mobile/lib/draftStore.js).
//  2. The editor's save validation + dirty-state — the pure bits worth a test.

export type IngredientPair = { measure: string; name: string };

// provenance drives the editor's attribution row + card stamps.
export type RecipeSource = 'imported' | 'manual' | 'otto';

// manual = blank editor · import = pre-filled review · edit = existing row.
export type DraftMode = 'manual' | 'import' | 'edit';

// Hand-off payload AND the editor's working shape. Text fields are strings
// ('' when empty); nulls only on the source/provenance fields the editor
// never turns into a blank string.
export interface Draft {
  mode: DraftMode;
  source: RecipeSource;
  sourceUrl: string | null;
  sourceName: string | null;
  title: string;
  image: string;
  category: string;
  area: string;
  servings: number;
  ingredients: IngredientPair[];
  steps: string[];
}

// What toSavePayload hands the recipes-table insert/update (minus user_id,
// which the query binds, and visibility, which defaults to 'private').
export interface CleanRecipe {
  source: RecipeSource;
  sourceUrl: string | null;
  sourceName: string | null;
  title: string;
  image: string | null;
  category: string | null;
  area: string | null;
  servings: number;
  ingredients: IngredientPair[];
  steps: string[];
}

const DEFAULT_SERVINGS = 1; // new recipes default to 1 (founder call 2026-07-21)

export function emptyIngredient(): IngredientPair {
  return { measure: '', name: '' };
}

// The recipe-detail edit link carries the "u-<n>" ref ("u-20"); the recipes
// row id is the bare integer. Strip the prefix before the integer test so the
// editor LOADS the existing row and SAVES via update — not the blank-form
// insert that made every edit create a new recipe. A bare numeric ("20") still
// works; a missing/garbage param is a create (null).
export function parseEditId(idParam: string | null | undefined): number | null {
  const raw = idParam?.replace(/^u-/, '');
  return raw && /^\d+$/.test(raw) ? Number(raw) : null;
}

// A blank manual draft — "Write it myself". carryUrl keeps a failed import's
// link so the source credit survives the fall-through to manual entry.
export function emptyDraft(carryUrl: string | null = null): Draft {
  return {
    mode: 'manual',
    source: 'manual',
    sourceUrl: carryUrl,
    sourceName: null,
    title: '',
    image: '',
    category: '',
    area: '',
    servings: DEFAULT_SERVINGS,
    ingredients: [emptyIngredient()],
    steps: [''],
  };
}

// Deep-enough copy for a dirty-state baseline: the arrays must not alias the
// live form's, or every edit would mutate the baseline and isDirty go blind.
export function cloneDraft(d: Draft): Draft {
  return {
    ...d,
    ingredients: d.ingredients.map((p) => ({ ...p })),
    steps: [...d.steps],
  };
}

// --- the hand-off shelf ---------------------------------------------------

let slot: Draft | null = null;

export function setDraft(next: Draft): void {
  slot = next;
}

// Reading takes it — a draft is consumed exactly once.
export function takeDraft(): Draft | null {
  const d = slot;
  slot = null;
  return d;
}

// --- save validation ------------------------------------------------------

export type SaveResult =
  | { ok: true; recipe: CleanRecipe }
  | { ok: false; error: string };

const trimOrNull = (s: string): string | null => {
  const t = s.trim();
  return t || null;
};

// Clean + validate the editor's fields into a saveable recipe. Steps are
// optional (Yazio); a name is not — the only hard requirement to save.
export function toSavePayload(draft: Draft): SaveResult {
  const title = draft.title.trim();
  if (!title) {
    return { ok: false, error: "Give it a name first — even 'Tuesday soup' works." };
  }
  const ingredients = draft.ingredients
    .map((p) => ({ measure: p.measure.trim(), name: p.name.trim() }))
    .filter((p) => p.name);
  const steps = draft.steps.map((s) => s.trim()).filter(Boolean);
  return {
    ok: true,
    recipe: {
      source: draft.source,
      sourceUrl: draft.sourceUrl,
      sourceName: draft.sourceName,
      title,
      image: trimOrNull(draft.image),
      category: trimOrNull(draft.category),
      area: trimOrNull(draft.area),
      servings: draft.servings,
      ingredients,
      steps,
    },
  };
}

// --- dirty-state ----------------------------------------------------------

// Compares the editable content of two drafts (not source/mode metadata).
// Drives the "discard your changes?" guard: a manual draft is dirty the moment
// it differs from the blank baseline; an edit is dirty once it diverges from
// the loaded row.
export function isDirty(current: Draft, baseline: Draft): boolean {
  if (
    current.title !== baseline.title ||
    current.image !== baseline.image ||
    current.category !== baseline.category ||
    current.area !== baseline.area ||
    current.servings !== baseline.servings ||
    current.steps.length !== baseline.steps.length ||
    current.ingredients.length !== baseline.ingredients.length
  ) {
    return true;
  }
  for (let i = 0; i < current.steps.length; i++) {
    if (current.steps[i] !== baseline.steps[i]) return true;
  }
  for (let i = 0; i < current.ingredients.length; i++) {
    if (
      current.ingredients[i].measure !== baseline.ingredients[i].measure ||
      current.ingredients[i].name !== baseline.ingredients[i].name
    ) {
      return true;
    }
  }
  return false;
}
