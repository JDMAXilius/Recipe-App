// Types for the Ask-Otto chat feature. The wire contract (request transcript +
// the three response modes) mirrors the deployed `generate-recipe` edge function
// in chat mode; StoredMessage is the device-local persistence shape (adds `ts`).

export type ChatRole = 'user' | 'assistant';

// One turn as sent to the function: role + content only (no timestamp).
export interface WireMessage {
  role: ChatRole;
  content: string;
}

// One turn as persisted in kv('chats'): adds the epoch-ms stamp the 30-day
// prune reads. Content is the plain text of the turn (options/recipe are
// ephemeral UI, not persisted — see chat.logic notes).
export interface StoredMessage extends WireMessage {
  ts: number;
}

// The recipe the function hands back in `mode:'recipe'`. Shape is a ready-to-save
// user recipe ("otto" provenance) — maps 1:1 onto import's CleanRecipe.
export interface ChatRecipe {
  title: string;
  servings: number;
  category: string;
  area: string;
  ingredients: { measure: string; name: string }[];
  steps: string[];
  image: null;
  source: 'otto';
  sourceUrl: null;
  sourceName: null;
}

// The three 200 shapes the function returns, discriminated on `mode`.
export type ChatResponse =
  | { mode: 'clarify'; message: string; options: string[] }
  | { mode: 'recipe'; message: string; recipe: ChatRecipe }
  | { mode: 'decline'; message: string };
