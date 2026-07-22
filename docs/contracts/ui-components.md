# Contract — Shared UI (`src/shared/ui/` + `src/shared/theme/`)

Status: M0 draft · Owner: ui-systems. Every feature codes against these
props; changing them mid-M3 re-issues feature packets — get them right here.

## Theme (`shared/theme/tokens.ts`, plain module — NOT a context)

```ts
export const colors = {
  terracotta: '#C4562E',  // computed values + interactive elements ONLY
  ink: '#2A2320',         // authored content (titles, body, user text)
  inkSoft: '#6B5F58',     // secondary authored text
  cream: '#FAF5EC',       // paper surfaces
  creamDeep: '#F2E9DA',   // raised/inset surfaces
  white: '#FFFFFF',
  danger: '#B3402A',
  success: '#5A7A4F',
}
export const fonts = { display: 'Lora', body: 'system' }
export const space = [0, 4, 8, 12, 16, 24, 32, 48]  // index-addressed
export const radii = { card: 16, sheet: 24, pill: 999 }
```

Light-only lock. **Semantic ink rule:** terracotta = computed/interactive,
ink = authored. Components enforce it via variants — callers pick meaning
(`variant="computed"`), never hex.

## The 8 primitives (props frozen at M0)

```ts
Button   { title, onPress, variant: 'primary'|'secondary'|'ghost'|'destructive',
           size?: 'md'|'lg', disabled?, loading? }
Text     { children, role: 'display'|'title'|'body'|'caption'|'computed' }
         // 'computed' renders terracotta; NO color escape hatch — a color
         // prop would let callers put terracotta on authored content and
         // void the semantic-ink rule. Role IS the color decision.
Sheet    { visible, onClose, title?, children }   // bottom sheet, web-safe
Ring     { value: number|null, max, label }       // null → renders em-dash, never 0
SegmentBar { segments: {label: string, value: string}[],
             selected: string,                 // by VALUE, never by index
             onSelect: (value: string) => void }
Toast    // no JSX use — imperative only:
         // useToast(): { show(message: string, kind: 'info'|'success'|'error'): void }
PawMark  { saved: boolean, onToggle, size? }      // the save affordance, everywhere
OttoArt  { name: OttoArtName, size? }             // typed catalog of painted assets
```

## Rules

1. Accessibility floor: role + label on every interactive, hit target ≥44pt.
2. Web + native parity — L3 drives these on Expo web; no caller-visible forks.
3. No `StyleSheet` in features for things a primitive covers; no per-screen
   style files exist in v2 at all.
4. `Ring` and every nutrition-displaying primitive obeys the honesty law:
   null in → visible "no data" out, never a fabricated zero.
5. New variant/prop = `contract_gap` → amend here → ui-systems implements →
   consumers re-issue. Never grown ad hoc.
