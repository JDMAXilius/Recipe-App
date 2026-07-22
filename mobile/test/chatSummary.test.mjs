import test from "node:test";
import assert from "node:assert/strict";
import { summarize, whenLabel, groupChats } from "../lib/chatSummary.js";

const ask = (text) => ({ from: "you", text });
const reply = (text) => ({ from: "otto", text });
const withRecipe = (title) => ({ from: "otto", text: "Here you go", recipe: { title } });

test("title is what the user actually asked, verbatim", () => {
  const chat = { thread: [ask("Something warm with chickpeas"), reply("Creamy or brothy?")] };
  assert.equal(summarize(chat).title, "Something warm with chickpeas");
});

test("a chat with no messages from you still gets a title", () => {
  assert.equal(summarize({ thread: [] }).title, "New chat");
  assert.equal(summarize({}).title, "New chat");
});

// The honesty law: "Saved" is a claim about the cookbook, not about Otto
// having written something.
test("only a genuinely saved recipe reads as Saved", () => {
  const saved = { savedTitle: "Creamy Chickpea Stew", thread: [ask("x"), withRecipe("Creamy Chickpea Stew")] };
  assert.equal(summarize(saved).subtitle, "Saved · Creamy Chickpea Stew");

  const walkedAway = { thread: [ask("x"), withRecipe("Creamy Chickpea Stew")] };
  assert.equal(summarize(walkedAway).subtitle, "Creamy Chickpea Stew · not saved");

  const noRecipe = { thread: [ask("x"), reply("Creamy or brothy?")] };
  assert.equal(summarize(noRecipe).subtitle, "1 reply · nothing saved");

  const several = { thread: [ask("x"), reply("a"), reply("b")] };
  assert.equal(summarize(several).subtitle, "2 replies · nothing saved");

  assert.equal(summarize({ thread: [ask("x")] }).subtitle, "Nothing yet");
});

test("the last recipe wins when Otto revised one", () => {
  const chat = { thread: [ask("x"), withRecipe("First Draft"), ask("vegan?"), withRecipe("Vegan Version")] };
  assert.equal(summarize(chat).subtitle, "Vegan Version · not saved");
});

test("whenLabel shortens by distance", () => {
  const now = new Date("2026-07-21T18:00:00Z").getTime();
  assert.equal(whenLabel(new Date(now - 30 * 1000).toISOString(), now), "now");
  assert.equal(whenLabel(new Date(now - 12 * 60000).toISOString(), now), "12m");
  assert.equal(whenLabel(new Date(now - 2 * 3600000).toISOString(), now), "2h");
  assert.equal(whenLabel("not a date", now), "");
});

test("groups split on calendar day, not a rolling 24h", () => {
  const now = new Date("2026-07-21T09:00:00Z").getTime();
  // 4h ago is yesterday by the clock even though it is under 24h old
  const lateLastNight = new Date("2026-07-20T23:00:00Z").toISOString();
  const groups = groupChats(
    [
      { id: "a", updatedAt: new Date(now - 3600000).toISOString() },
      { id: "b", updatedAt: lateLastNight },
      { id: "c", updatedAt: new Date(now - 20 * 24 * 3600000).toISOString() },
    ],
    now
  );
  assert.deepEqual(
    groups.map((g) => [g.label, g.rows.map((r) => r.id)]),
    [
      ["Today", ["a"]],
      ["Earlier this week", ["b"]],
      ["Older", ["c"]],
    ]
  );
});

test("empty groups never render a heading over nothing", () => {
  const now = Date.now();
  const groups = groupChats([{ id: "a", updatedAt: new Date(now).toISOString() }], now);
  assert.deepEqual(groups.map((g) => g.label), ["Today"]);
  assert.deepEqual(groupChats([], now), []);
  assert.deepEqual(groupChats(null, now), []);
});
