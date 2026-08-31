export interface CallStatusResponse {
  remainingCalls: number;
  capSeconds: number;
}

export interface CallStartResponse {
  allowed: boolean;
  sessionId?: string;
  remainingCalls: number;
  message?: string;
}

export interface CallEndPayload {
  sessionId: string;
  transcript: { role: "agent" | "user"; text: string }[];
  durationSeconds: number;
}

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
  /** honeypot field — must stay empty; humans never see or fill it */
  company?: string;
}

export interface TranscriptEntry {
  role: "agent" | "user";
  text: string;
}

export interface VoiceTurnResponse {
  ended: boolean;
  reason?: "not_found" | "time_limit";
  userText?: string;
  text?: string;
  audioBase64?: string;
  mimeType?: string;
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

async function asJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok && res.status !== 429 && res.status !== 400) {
    throw new Error((data as { message?: string })?.message ?? "Request failed");
  }
  return data as T;
}

export function getCallStatus(): Promise<CallStatusResponse> {
  return fetch("/api/call/status").then((res) => asJson<CallStatusResponse>(res));
}

export function startCall(): Promise<CallStartResponse> {
  return fetch("/api/call/start", { method: "POST" }).then((res) =>
    asJson<CallStartResponse>(res),
  );
}

export function endCall(payload: CallEndPayload): Promise<{ ok: boolean }> {
  return fetch("/api/call/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((res) => asJson<{ ok: boolean }>(res));
}

export function sendVoiceTurn(
  sessionId: string,
  history: TranscriptEntry[],
  audioBlob: Blob,
): Promise<VoiceTurnResponse> {
  return fetch("/api/voice/turn", {
    method: "POST",
    headers: {
      "Content-Type": audioBlob.type || "audio/webm",
      "X-Session-Id": sessionId,
      "X-History": utf8ToBase64(JSON.stringify(history)),
    },
    body: audioBlob,
  }).then((res) => asJson<VoiceTurnResponse>(res));
}

export function submitContact(
  payload: ContactPayload,
): Promise<{ ok: boolean; errors?: Record<string, string> }> {
  return fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((res) => asJson<{ ok: boolean; errors?: Record<string, string> }>(res));
}
