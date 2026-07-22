// Plain-text shares — the one payload every channel accepts (WhatsApp,
// Messages, mail, Notes). Pure copy generation, no RN/navigator here (that
// runtime side lives with the consumer). WhatsApp renders *stars* as bold and
// "- " as bullets; plain hyphens paste cleanly into Reminders/Notes. No
// Unicode glyphs. Honesty: attribution always travels; nothing is added that
// wasn't on screen.
import type { ShareRecipe, ShoppingListState } from './share.types';

const SIGNOFF = 'Shared from Otto, the quieter kind of cookbook.';

// `url` (optional): when a public share link exists it rides along in the text.
export function buildRecipeShareText(recipe: ShareRecipe, url?: string): string {
  const lines: string[] = [`*${recipe.title}*`];

  if (recipe.servings) lines.push('', `For ${recipe.servings} servings`);

  if (recipe.ingredients.length) {
    lines.push('', '*Ingredients*');
    for (const item of recipe.ingredients) lines.push(`- ${item}`);
  }

  if (recipe.steps.length) {
    lines.push('', '*Method*');
    recipe.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
  }

  // Attribution is immutable — it travels on every shared artifact.
  if (recipe.sourceUrl) {
    lines.push('', `From ${recipe.sourceName || recipe.sourceUrl}: ${recipe.sourceUrl}`);
  }

  if (url) lines.push('', `Open it here: ${url}`);

  lines.push('', SIGNOFF);
  return lines.join('\n');
}

// Same grouping the picture uses (open items, by aisle, then extras) so the
// text and the card always agree. Checked rows stay home.
export function buildShoppingListShareText(state: ShoppingListState): string {
  const { items = [], custom = [], checked = {} } = state;
  const lines = ['*Shopping list*'];

  const open = items.filter((i) => !checked[i.key]);
  const aisles = [...new Set(open.map((i) => i.aisle))];
  for (const aisle of aisles) {
    lines.push('', `*${aisle}*`);
    for (const item of open.filter((i) => i.aisle === aisle)) {
      const amount = item.amount ? `${item.amount} ` : '';
      const provenance = item.sources?.length ? ` (for ${item.sources.join(', ')})` : '';
      lines.push(`- ${amount}${item.name}${provenance}`);
    }
  }

  const extras = custom.filter((c) => !checked[c.key]);
  if (extras.length) {
    lines.push('', '*Extras*');
    for (const extra of extras) lines.push(`- ${extra.name}`);
  }

  lines.push('', SIGNOFF);
  return lines.join('\n');
}
