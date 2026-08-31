const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io";
const STT_MODEL_ID = "scribe_v2";
const TTS_MODEL_ID = "eleven_multilingual_v2";

function getApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY must be set");
  return key;
}

function getVoiceId(): string {
  return process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([audioBuffer], { type: mimeType }), "recording.webm");
  form.append("model_id", STT_MODEL_ID);

  const res = await fetch(`${ELEVENLABS_BASE_URL}/v1/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": getApiKey() },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs STT failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const res = await fetch(
    `${ELEVENLABS_BASE_URL}/v1/text-to-speech/${getVoiceId()}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": getApiKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, model_id: TTS_MODEL_ID }),
    },
  );

  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${await res.text()}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
