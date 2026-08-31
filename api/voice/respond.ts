import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { getAnthropic, BRAIN_MODEL } from "../_lib/anthropic.js";
import { synthesizeSpeech } from "../_lib/elevenlabsVoice.js";
import { buildSystemPrompt, profile } from "../_lib/profile.js";

interface TranscriptEntry {
  role: "agent" | "user";
  text: string;
}

interface RespondBody {
  sessionId?: string;
  history?: TranscriptEntry[];
  userText?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const { sessionId, history = [], userText }: RespondBody = req.body ?? {};

  if (!sessionId || !userText) {
    res.status(400).json({ message: "sessionId and userText are required." });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: session, error: fetchError } = await supabase
      .from("call_sessions")
      .select("id, started_at, ended_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!session || session.ended_at) {
      res.status(200).json({ ended: true, reason: "not_found" });
      return;
    }

    const elapsedSeconds = (Date.now() - new Date(session.started_at).getTime()) / 1000;
    if (elapsedSeconds > profile.callWidget.capSeconds + 5) {
      res.status(200).json({ ended: true, reason: "time_limit" });
      return;
    }

    const message = await getAnthropic().messages.create({
      model: BRAIN_MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages: [
        ...history.map((h) => ({
          role: h.role === "agent" ? ("assistant" as const) : ("user" as const),
          content: h.text,
        })),
        { role: "user" as const, content: userText },
      ],
    });

    const replyText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");

    const audioBuffer = await synthesizeSpeech(replyText);

    res.status(200).json({
      ended: false,
      text: replyText,
      audioBase64: audioBuffer.toString("base64"),
      mimeType: "audio/mpeg",
    });
  } catch (err) {
    console.error("[voice/respond]", err);
    res.status(500).json({ message: "Could not generate a reply." });
  }
}
