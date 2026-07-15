// Detect the primary cooking ACTION of a step so cook mode can show the
// matching hand-painted Otto spot illustration (cook-mode blueprint: per-step
// *type* art at zero content cost — never per-step photos).
// Deterministic: the earliest action keyword in the text wins (a step's
// primary action is almost always its first verb).

const ACTIONS = [
  { id: "chop", words: ["chop", "slice", "dice", "cut ", "mince", "peel", "shred", "grate", "trim", "halve"] },
  { id: "mix", words: ["stir", "mix", "whisk", "combine", "fold", "beat", "toss", "blend", "knead"] },
  { id: "saute", words: ["sauté", "saute", "sear", "brown ", "fry", "skillet", "wok", "heat oil", "heat the oil", "frying pan"] },
  { id: "simmer", words: ["simmer", "boil", "poach", "steam", "reduce", "bubbl"] },
  { id: "bake", words: ["bake", "oven", "roast", "preheat", "broil", "grill"] },
  { id: "wait", words: ["rest", "marinate", "chill", "stand", "cool", "refrigerat", "soak", "set aside", "let sit", "leave to", "rise", "prove"] },
  { id: "season", words: ["season", "sprinkle", "garnish", "drizzle", "glaze", "brush with", "salt and pepper"] },
  { id: "pour", words: ["pour", "spread", "layer", "arrange", "transfer", "place ", "spoon over", "spoon the", "top with", "cover"] },
  { id: "serve", words: ["serve", "plate up", "enjoy", "portion"] },
];

export const ACTION_IDS = [...ACTIONS.map((a) => a.id), "cook"];

export function detectStepAction(text) {
  const haystack = ` ${(text || "").toLowerCase()} `;
  let best = { id: "cook", index: Infinity };
  for (const action of ACTIONS) {
    for (const word of action.words) {
      const index = haystack.indexOf(word);
      if (index !== -1 && index < best.index) {
        best = { id: action.id, index };
      }
    }
  }
  return best.id;
}

// Art lookup — hand-painted Otto action spots (assets/actions/).
// Falls back to the generic cooking Otto until/if a file is missing.
export const ACTION_ART = {
  chop: require("../assets/actions/otto-chop.png"),
  mix: require("../assets/actions/otto-mix.png"),
  saute: require("../assets/actions/otto-saute.png"),
  simmer: require("../assets/actions/otto-simmer.png"),
  bake: require("../assets/actions/otto-bake.png"),
  wait: require("../assets/actions/otto-wait.png"),
  season: require("../assets/actions/otto-season.png"),
  pour: require("../assets/actions/otto-pour.png"),
  serve: require("../assets/actions/otto-serve.png"),
  cook: require("../assets/actions/otto-cook.png"),
};
