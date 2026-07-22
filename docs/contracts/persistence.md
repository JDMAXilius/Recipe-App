# Contract — Persistence (`shared/storage.ts` + Supabase session)

Status: **parity draft** · Owner: builder (shared) + security-builder (session).
v2 currently persists **nothing** across restart (AsyncStorage not installed) —
sessions, prefs, journal, shopping, and the onboarding gate all reset. This
contract defines the one typed persistence layer that fixes it.

Principle: **server-owned data lives in Supabase (via TanStack Query); only
genuinely device-local, non-server state uses AsyncStorage** — and it goes
through one typed keyspace, never scattered string keys.

---

## 1. The typed keyspace (`shared/storage.ts`)

One module over `@react-native-async-storage/async-storage`. Replaces v1's ~9
ad-hoc `otto.*.v1` strings with a typed, versioned, namespaced API:

```ts
// keys are an enum — no raw strings at call sites
export const kv = {
  get<T>(key: StoreKey, fallback: T): Promise<T>
  set<T>(key: StoreKey, value: T): Promise<void>
  remove(key: StoreKey): Promise<void>
}
export type StoreKey =
  | 'onboarded'        // first-run gate         (v1 otto.onboarded.v1)
  | 'unitSystem'       // metric | us            (v1 otto.unitSystem.v1)
  | 'prefs'            // diet + cuisines        (v1 otto.prefs.v1)
  | 'notifPrefs'       // reminder toggles/hour  (v1 otto.notifications.v1)
  | 'firstSaveCelebrated'
  | 'shoppingState'    // checked + custom + excluded  (v1 otto.shopping.v1)
  | 'household'        // membership token       (v1 otto.household.v1)
  | 'householdRecent'  // rejoin history (≤3)    (v1 otto.household.recent.v1)
  | 'journal'          // plate-photo entries    (v1 otto.journal.<id> → one map here)
  | 'chats'            // Ask-Otto history (30-day/50-cap)
```

Rules: values are JSON-serializable and **schema-validated with zod on read**
(a corrupt/legacy blob falls back, never throws). Writes are best-effort and
never block UI. No feature imports `AsyncStorage` directly — only `kv`.

---

## 2. Supabase session persistence (`shared/supabase/client.ts`)

The client MUST persist the auth session so users aren't logged out on every
launch (v1 parity). security-builder wires:

```ts
createClient<Database>(url, anon, {
  auth: {
    storage: AsyncStorage,        // ← the missing piece
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})
```

Guest/anonymous sessions (`signInAnonymously`, created in onboarding) persist
the same way; upgrade-in-place on first sign-up keeps the row.

---

## 3. Server cache

Server state stays in **TanStack Query** (favorites, plan, recipes, nutrition,
collab) — NOT duplicated into `kv`. Query-cache disk persistence is **out of
scope** (YAGNI — v1 never did it); revisit only if offline-first is requested.

## 4. What each store feeds

| Key | Written by | Read by |
|---|---|---|
| onboarded | onboarding | app shell (first-run gate) |
| unitSystem / prefs | profile (Preferences) | recipes (pref-aware pick/diet), detail/cook (unit display) |
| notifPrefs | profile (Notifications) | `shared/notifications.ts` engine |
| shoppingState | planner (Shopping) | planner (Shopping) |
| household* | planner (Household) | planner (Household) |
| journal | cook (plate capture) | profile (Journal grid) |
| chats | chat (Ask-Otto) | chat (recent chats) |
| firstSaveCelebrated | PawMark | PawMark |

Each key has exactly one writer feature (above). A second writer = `contract_gap`.
