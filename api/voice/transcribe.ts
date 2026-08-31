import type { VercelRequest, VercelResponse } from "@vercel/node";
import { transcribeAudio } from "../_lib/elevenlabsVoice.js";

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const audioBuffer = Buffer.isBuffer(req.body) ? req.body : await readRawBody(req);
    if (audioBuffer.length === 0) {
      res.status(400).json({ message: "No audio data received." });
      return;
    }

    const mimeType = req.headers["content-type"] || "audio/webm";
    const text = await transcribeAudio(audioBuffer, mimeType);
    res.status(200).json({ text });
  } catch (err) {
    console.error("[voice/transcribe]", err);
    res.status(500).json({ message: "Could not transcribe audio." });
  }
}
