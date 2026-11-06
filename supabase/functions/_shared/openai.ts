// openai — the one model-call helper every function shares. OPENAI_API_KEY is
// read ONLY from Deno.env, never logged or echoed. Chat Completions with a
// strict json_schema response_format: output is schema-constrained, so a
// parse failure is a model fault (null), never a guess.
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export const openaiActive = () => Boolean(Deno.env.get("OPENAI_API_KEY"));

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };
export type ChatMessage = { role: "user" | "assistant"; content: string | ContentPart[] };

export type AskOptions = {
  model: string;
  system: string;
  schema: unknown;
  messages: ChatMessage[];
  maxTokens: number;
  effort?: string; // reasoning_effort: the latency knob ("low" for chat turns)
  stream?: boolean;
};

export function requestBody(o: AskOptions) {
  return {
    model: o.model,
    max_completion_tokens: o.maxTokens,
    messages: [{ role: "system", content: o.system }, ...o.messages],
    response_format: { type: "json_schema", json_schema: { name: "otto", strict: true, schema: o.schema } },
    ...(o.effort ? { reasoning_effort: o.effort } : {}),
    ...(o.stream ? { stream: true, stream_options: { include_usage: true } } : {}),
  };
}

export async function openaiFetch(o: AskOptions, timeoutMs: number): Promise<Response> {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")!}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(requestBody(o)),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`OpenAI answered ${response.status}`);
  return response;
}

// "length" = hit max tokens, "content_filter" = refused: either way the JSON
// is not trustworthy.
export const truncated = (finish: string | null | undefined) =>
  finish === "length" || finish === "content_filter";

// APP-11: token counts only — never prompt or output content — so spend per
// call is readable in function_edge_logs.
// deno-lint-ignore no-explicit-any
export function logUsage(model: string, usage: any, finishReason: string | null | undefined) {
  console.log(JSON.stringify({
    event: "openai_usage",
    model,
    input_tokens: usage?.prompt_tokens ?? null,
    output_tokens: usage?.completion_tokens ?? null,
    cached_input_tokens: usage?.prompt_tokens_details?.cached_tokens ?? null,
    reasoning_tokens: usage?.completion_tokens_details?.reasoning_tokens ?? null,
    finish_reason: finishReason ?? null,
  }));
}

// One non-streaming call → parsed JSON object, or null when the model lost
// the plot (truncated, refused, unparseable).
// deno-lint-ignore no-explicit-any
export async function askJson(o: AskOptions, timeoutMs: number): Promise<any> {
  const response = await openaiFetch({ ...o, stream: false }, timeoutMs);
  const data = await response.json();
  const choice = data.choices?.[0];
  logUsage(o.model, data.usage, choice?.finish_reason);
  if (!choice || truncated(choice.finish_reason) || choice.message?.refusal) return null;
  try {
    return JSON.parse(choice.message?.content ?? "");
  } catch {
    return null;
  }
}

// otto-agent (1.2): one round of function calling. Returns the model's message
// (text and/or tool_calls), or null when it ran out of room or refused.
export type ToolMessage =
  | { role: "user" | "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };
export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

export async function askTools(
  o: { model: string; system: string; messages: ToolMessage[]; tools: unknown[]; maxTokens: number; effort?: string },
  timeoutMs: number,
): Promise<{ content: string | null; tool_calls?: ToolCall[] } | null> {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")!}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: o.model,
      max_completion_tokens: o.maxTokens,
      messages: [{ role: "system", content: o.system }, ...o.messages],
      tools: o.tools,
      tool_choice: "auto",
      ...(o.effort ? { reasoning_effort: o.effort } : {}),
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`OpenAI answered ${response.status}`);
  const data = await response.json();
  const choice = data.choices?.[0];
  logUsage(o.model, data.usage, choice?.finish_reason);
  if (!choice || truncated(choice.finish_reason) || choice.message?.refusal) return null;
  return { content: choice.message?.content ?? null, tool_calls: choice.message?.tool_calls };
}
