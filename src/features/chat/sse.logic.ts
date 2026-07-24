// Pure SSE frame parsing for the streaming chat path — zero framework imports
// so node --test can strip-type it directly (sse.logic.test.mjs), same pattern
// as chat.logic.ts. Feed raw text chunks in any split; every complete
// `data: <json>\n\n` event comes out parsed, and the incomplete tail rides
// along as `carry` for the next chunk. Unparseable data lines are skipped so a
// garbled frame never kills the stream.
export function feedSse(chunk: string, carry: string): { events: unknown[]; carry: string } {
  const frames = (carry + chunk).split(/\r?\n\r?\n/);
  const rest = frames.pop() ?? '';
  const events: unknown[] = [];
  for (const frame of frames) {
    for (const line of frame.split(/\r?\n/)) {
      if (!line.startsWith('data:')) continue; // comments/other fields ignored
      try {
        events.push(JSON.parse(line.slice(5).trim()) as unknown);
      } catch {
        // garbage tolerance: skip lines that aren't valid JSON
      }
    }
  }
  return { events, carry: rest };
}
