import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { getAnthropic, LIVE_REPLY_MODEL } from "../_lib/anthropic.js";
import { synthesizeSpeech, transcribeAudio } from "../_lib/elevenlabsVoice.js";
import { buildSystemPrompt, profile } from "../_lib/profile.js";

interface TranscriptEntry {
  role: "agent" | "user";
  text: string;
}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function readHistoryHeader(req: VercelRequest): TranscriptEntry[] {
  const header = req.headers["x-history"];
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return [];
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const sessionIdHeader = req.headers["x-session-id"];
  const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

  if (!sessionId) {
    res.status(400).json({ message: "X-Session-Id header is required." });
    return;
  }

  try {
    const audioBuffer = Buffer.isBuffer(req.body) ? req.body : await readRawBody(req);
    if (audioBuffer.length === 0) {
      res.status(400).json({ message: "No audio data received." });
      return;
    }

    const mimeType = req.headers["content-type"] || "audio/webm";
    const userText = await transcribeAudio(audioBuffer, mimeType);

    if (!userText?.trim()) {
      res.status(200).json({ ended: false, userText: "" });
      return;
    }

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

    const history = readHistoryHeader(req);

    const message = await getAnthropic().messages.create({
      model: LIVE_REPLY_MODEL,
      max_tokens: 150,
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

    const audioReply = await synthesizeSpeech(replyText);

    res.status(200).json({
      ended: false,
      userText,
      text: replyText,
      audioBase64: audioReply.toString("base64"),
      mimeType: "audio/mpeg",
    });
  } catch (err) {
    console.error("[voice/turn]", err);
    res.status(500).json({ message: "Could not process the voice turn." });
  }
}
