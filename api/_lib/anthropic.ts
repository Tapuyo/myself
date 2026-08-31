import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY must be set");
  client = new Anthropic({ apiKey });
  return client;
}

export const SUMMARY_MODEL = "claude-sonnet-4-5";
/** Faster model for live voice turns, where generation latency matters most. */
export const LIVE_REPLY_MODEL = "claude-haiku-4-5-20251001";
