// streamParse — pure helpers for the chat streaming branch. Zero imports,
// node-test-loadable like imageMode.ts.

// Decoded value-so-far of the top-level "message" string property in a
// partial JSON buffer. Returns '' until the value's opening quote arrives.
// ponytail: finds the first `"message"` key textually — safe because the
// schema-constrained output emits "mode" (a closed enum that can't contain
// the token) before "message"; revisit if the schema ever changes order.
export function extractMessagePrefix(buffer: string): string {
  const key = buffer.indexOf('"message"');
  if (key === -1) return "";
  let i = key + '"message"'.length;
  while (i < buffer.length && " \t\r\n".includes(buffer[i])) i++;
  if (buffer[i] !== ":") return "";
  i++;
  while (i < buffer.length && " \t\r\n".includes(buffer[i])) i++;
  if (buffer[i] !== '"') return "";
  i++;
  let out = "";
  while (i < buffer.length) {
    const ch = buffer[i];
    if (ch === '"') return out; // closing unescaped quote
    if (ch !== "\\") {
      out += ch;
      i++;
      continue;
    }
    // Escape sequence. If it isn't fully buffered yet, stop before it — the
    // next chunk will complete it and the decoded string only ever grows.
    if (i + 1 >= buffer.length) return out;
    const esc = buffer[i + 1];
    if (esc === "u") {
      if (i + 6 > buffer.length) return out; // mid \uXXXX
      const code = parseInt(buffer.slice(i + 2, i + 6), 16);
      out += Number.isNaN(code) ? "" : String.fromCharCode(code);
      i += 6;
      continue;
    }
    const map: Record<string, string> = {
      '"': '"',
      "\\": "\\",
      "/": "/",
      n: "\n",
      t: "\t",
      r: "\r",
      b: "\b",
      f: "\f",
    };
    out += map[esc] ?? esc; // unknown escape: pass the char through
    i += 2;
  }
  return out;
}

// Splits an SSE byte stream (already text-decoded) into complete `data:`
// JSON payload strings. Lines can split anywhere across chunks: `carry` is
// the incomplete trailing line — feed it back in on the next call. Ignores
// `event:` lines, blank event separators, and non-JSON data like "[DONE]".
export function parseSseLines(chunk: string, carry: string): { events: string[]; carry: string } {
  const lines = (carry + chunk).split("\n");
  const nextCarry = lines.pop() ?? ""; // '' when the chunk ended on \n
  const events: string[] = [];
  for (const line of lines) {
    const clean = line.endsWith("\r") ? line.slice(0, -1) : line;
    if (!clean.startsWith("data:")) continue;
    const payload = clean.slice("data:".length).trimStart();
    if (payload.startsWith("{")) events.push(payload);
  }
  return { events, carry: nextCarry };
}
