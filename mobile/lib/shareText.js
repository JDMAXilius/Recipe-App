// Plain-text shares (docs/IMPORT_SHARE_RESEARCH.md, phase S0). Text is the
// one payload every channel accepts — WhatsApp, Messages, mail, Notes — so
// the share button works today, with no public pages behind it. WhatsApp
// renders *stars* as bold and "- " as bullets; plain hyphens paste cleanly
// into Reminders/Notes. No Unicode checkbox glyphs (they render unevenly).
// Honesty: attribution always travels; nothing is added that isn't on screen.
import { Share, Platform } from "react-native";

// recipe: the app-wide transformed shape (title, ingredients[] or
// ingredientPairs[], instructions[]/steps[], servings?, sourceName?,
// sourceUrl?, originalData?.strSource for seed recipes).
export function buildRecipeShareText(recipe) {
  const lines = [`*${recipe.title}*`];

  const servings = recipe.servings;
  if (servings) lines.push("", `For ${servings} servings`);

  const ingredients =
    recipe.ingredients && recipe.ingredients.length
      ? recipe.ingredients
      : (recipe.ingredientPairs || []).map((p) => `${p.measure} ${p.name}`.trim());
  if (ingredients.length) {
    lines.push("", "*Ingredients*");
    for (const item of ingredients) lines.push(`- ${item}`);
  }

  const steps = recipe.instructions?.length ? recipe.instructions : recipe.steps || [];
  if (steps.length) {
    lines.push("", "*Method*");
    steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
  }

  // Attribution is immutable — it travels on every shared artifact.
  const sourceUrl = recipe.sourceUrl || recipe.originalData?.strSource || null;
  const sourceName =
    recipe.sourceName || (recipe.originalData?.strSource ? "the original recipe" : null);
  if (sourceUrl) lines.push("", `From ${sourceName || sourceUrl}: ${sourceUrl}`);

  lines.push("", "Shared from Otto, the quieter kind of cookbook.");
  return lines.join("\n");
}

// items: buildShoppingList() rows ({key, name, aisle, amount, sources}),
// custom: [{key, name}], checked: {key: true} — checked rows stay home.
export function buildShoppingListShareText({ items = [], custom = [], checked = {} }) {
  const lines = ["*Shopping list*"];

  const open = items.filter((i) => !checked[i.key]);
  const aisles = [...new Set(open.map((i) => i.aisle))];
  for (const aisle of aisles) {
    lines.push("", `*${aisle}*`);
    for (const item of open.filter((i) => i.aisle === aisle)) {
      const amount = item.amount ? `${item.amount} ` : "";
      const provenance = item.sources?.length ? ` (for ${item.sources.join(", ")})` : "";
      lines.push(`- ${amount}${item.name}${provenance}`);
    }
  }

  const extras = custom.filter((c) => !checked[c.key]);
  if (extras.length) {
    lines.push("", "*Extras*");
    for (const extra of extras) lines.push(`- ${extra.name}`);
  }

  lines.push("", "Shared from Otto, the quieter kind of cookbook.");
  return lines.join("\n");
}

// One entry point for both surfaces. Native opens the system share sheet;
// web prefers the browser share sheet and falls back to the clipboard
// (caller shows the toast — Alert.alert is a web no-op, D-rule).
// Returns { shared, copied } so the caller knows what actually happened.
export async function sharePlainText(message, title) {
  if (Platform.OS === "web") {
    // navigator.share exists on mobile browsers + some desktops; clipboard
    // is the universal fallback. Never both.
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: message });
        return { shared: true, copied: false };
      }
    } catch (error) {
      if (error?.name === "AbortError") return { shared: false, copied: false };
      // fall through to clipboard on NotAllowedError etc.
    }
    try {
      await navigator.clipboard.writeText(message);
      return { shared: false, copied: true };
    } catch {
      return { shared: false, copied: false };
    }
  }
  try {
    await Share.share(
      // iOS accepts {message}; Android ignores title-less extras — message
      // carries everything since there is no URL payload yet (S0).
      { message, title },
      { dialogTitle: title, subject: title }
    );
    return { shared: true, copied: false };
  } catch {
    return { shared: false, copied: false };
  }
}
