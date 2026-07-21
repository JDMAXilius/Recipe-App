// Throwaway probe — TERMINAL_TICKET_NUTRITION_FRAMEWORK Task 2 (roadmap N8).
// Live-fires the Claude matcher + USDA Stage 2 with adversarial names and
// prints input → resolved food → kcal/100g. Delete after the ticket closes.
// Run: node --env-file=.env scripts/probe-matcher.mjs
import { resolveIngredientNames } from "../src/lib/nutrition/resolveIngredient.js";

const NAMES = [
  "beef mince", "minced beef", "aubergine", "courgette", "spring onions",
  "coriander leaves", "coriander seeds", "gochujang", "doubanjiang",
  "nutritional yeast", "vital wheat gluten", "oat milk", "almond creamer",
  "stevia", "monk fruit sweetener", "ghee", "paneer", "halloumi", "orzo",
  "farro", "plantains", "tomatillos", "kimchi", "miso paste", "tahini",
  "pomegranate molasses", "green beans", "sweet potato", "coconut milk",
  "white rice",
];

// Identity-swap red flags: input must NOT resolve to a food whose description
// matches the banned pattern (the prompt forbids these exact swaps).
const SWAP_CHECKS = [
  ["green beans", /\bbeans\b/i, /green/i],       // beans, but not green
  ["sweet potato", /\bpotato\b/i, /sweet/i],     // potato, but not sweet
  ["coconut milk", /\bmilk\b/i, /coconut/i],     // milk, but not coconut
];

const t0 = performance.now();
const resolved = await resolveIngredientNames(NAMES);
const secs = ((performance.now() - t0) / 1000).toFixed(1);

let hits = 0;
const flags = [];
console.log("input".padEnd(24) + "resolved food".padEnd(52) + "kcal/100g");
console.log("-".repeat(88));
for (const name of NAMES) {
  const row = resolved.get(name.toLowerCase());
  if (row) hits++;
  console.log(
    name.padEnd(24) +
      String(row?.usda ?? "(null — honest miss)").slice(0, 50).padEnd(52) +
      String(row?.kcal ?? "-")
  );
  const check = SWAP_CHECKS.find(([n]) => n === name);
  if (check && row?.usda && check[1].test(row.usda) && !check[2].test(row.usda)) {
    flags.push(`IDENTITY SWAP: "${name}" → "${row.usda}"`);
  }
  if (row?.usda && /\b(brand|branded)\b/i.test(row.usda)) {
    flags.push(`BRANDED PICK: "${name}" → "${row.usda}"`);
  }
}
console.log("-".repeat(88));
console.log(`${hits}/${NAMES.length} resolved in ${secs}s (nulls are honest misses, not errors)`);
console.log(flags.length ? "RED FLAGS:\n" + flags.map((f) => "  " + f).join("\n") : "No identity-swap red flags.");
