// A write that matched no row is not a success. RLS lets a user READ a
// household partner's rows but change only their own, and PostgREST answers a
// 0-row update or delete without an error: without this check the app (and
// Otto) would say "done" when nothing changed. Use with `.select('<pk>')`.
export function changed<T>(res: { data: T[] | null; error: unknown }, what: string): T[] {
  if (res.error) throw res.error;
  if (!res.data?.length) throw new Error(`${what} isn't there any more, or isn't yours to change.`);
  return res.data;
}
