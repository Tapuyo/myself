import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin";
import { getAnthropic, SUMMARY_MODEL } from "../_lib/anthropic";

interface TranscriptEntry {
  role: "agent" | "user";
  text: string;
}

interface CallEndBody {
  sessionId?: string;
  transcript?: TranscriptEntry[];
  durationSeconds?: number;
}

interface CallSummary {
  intent: string;
  visitorName: string | null;
  visitorEmail: string | null;
  keyQuestions: string[];
  summary: string;
}

const EXTRACT_TOOL = {
  name: "record_call_summary",
  description: "Records a structured summary of the call for the site owner's follow-up.",
  input_schema: {
    type: "object" as const,
    properties: {
      intent: { type: "string", description: "Why the visitor called, in one short phrase." },
      visitorName: { type: ["string", "null"], description: "Visitor's name if they gave one, else null." },
      visitorEmail: { type: ["string", "null"], description: "Visitor's email if they gave one, else null." },
      keyQuestions: { type: "array", items: { type: "string" }, description: "The main questions the visitor asked." },
      summary: { type: "string", description: "2-4 sentence summary of the conversation for the site owner." },
    },
    required: ["intent", "visitorName", "visitorEmail", "keyQuestions", "summary"],
  },
};

async function summarizeTranscript(transcript: TranscriptEntry[]): Promise<CallSummary> {
  const transcriptText = transcript
    .map((t) => `${t.role === "agent" ? "AI Self" : "Visitor"}: ${t.text}`)
    .join("\n");

  const message = await getAnthropic().messages.create({
    model: SUMMARY_MODEL,
    max_tokens: 1024,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
    messages: [
      {
        role: "user",
        content: `Here is the transcript of a voice call between a website visitor and an AI assistant representing the site owner. Extract a structured summary using the record_call_summary tool.\n\n${transcriptText}`,
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a structured summary");
  }
  return toolUse.input as CallSummary;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const { sessionId, transcript, durationSeconds }: CallEndBody = req.body ?? {};

  if (!sessionId || !Array.isArray(transcript)) {
    res.status(400).json({ ok: false, message: "sessionId and transcript are required." });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: existing, error: fetchError } = await supabase
      .from("call_sessions")
      .select("id, ended_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing || existing.ended_at) {
      res.status(404).json({ ok: false, message: "Call session not found or already ended." });
      return;
    }

    let extracted: CallSummary | null = null;
    if (transcript.length > 0) {
      try {
        extracted = await summarizeTranscript(transcript);
      } catch (err) {
        console.error("[call/end] summarization failed", err);
      }
    }

    const transcriptText = transcript.map((t) => `${t.role}: ${t.text}`).join("\n");

    const { error: updateError } = await supabase
      .from("call_sessions")
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds ?? null,
        visitor_name: extracted?.visitorName ?? null,
        visitor_email: extracted?.visitorEmail ?? null,
        summary: extracted?.summary ?? null,
        transcript: transcriptText,
      })
      .eq("id", sessionId);

    if (updateError) throw updateError;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[call/end]", err);
    res.status(500).json({ ok: false, message: "Could not save the call summary." });
  }
}
