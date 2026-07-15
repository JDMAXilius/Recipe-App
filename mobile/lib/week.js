// Date helpers for Otto's week — local-time, dependency-free. The week is a
// rolling 7 days starting today (the payoff moment is 5pm, not Sunday).

export function toDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function weekDays(from = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    return {
      key: toDayKey(date),
      label:
        i === 0
          ? "Today"
          : i === 1
            ? "Tomorrow"
            : date.toLocaleDateString(undefined, { weekday: "long" }),
      sub: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
  });
}
