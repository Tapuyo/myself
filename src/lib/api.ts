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

export function submitContact(
  payload: ContactPayload,
): Promise<{ ok: boolean; errors?: Record<string, string> }> {
  return fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((res) => asJson<{ ok: boolean; errors?: Record<string, string> }>(res));
}
