// The Otto tab (R3.4, flowV2): Otto AI as a tab root, in the trailing circle.
// v1 cooks for this home (B6): the route tells the chat who's eating, the
// diet, the allergies (as plain labels), the foods to skip and what's already
// planned this week. Sent to OpenAI with each turn (privacy truth table).
import { useMemo } from 'react';
import { ChatScreen } from '@/features/chat';
import { servingsFor, usePrefs } from '@/features/profile';
import { usePlan } from '@/features/planner';
import { ALLERGENS } from '@/shared/allergens';

export default function Otto() {
  const prefs = usePrefs();
  const { entries } = usePlan();
  const context = useMemo(
    () => ({
      servings: servingsFor(prefs.household),
      diet: prefs.diet,
      cuisines: prefs.cuisines.slice(0, 6),
      allergies: ALLERGENS.filter((a) => prefs.allergies.includes(a.key)).map((a) => a.label),
      skips: prefs.skips.map((s) => s.trim().slice(0, 40)).filter(Boolean).slice(0, 20),
      week: [...new Set(entries.filter((e) => !e.cooked).map((e) => (e.title ?? '').trim().slice(0, 120)).filter(Boolean))].slice(0, 21),
    }),
    [prefs.household, prefs.diet, prefs.cuisines, prefs.allergies, prefs.skips, entries],
  );
  return <ChatScreen context={context} />;
}
