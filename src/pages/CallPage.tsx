import { useEffect, useRef, useState } from "react";
import { headshotUrl } from "../assets/images";
import { CallCapNotice } from "../components/CallCapNotice";
import { CallCountdown } from "../components/CallCountdown";
import { RemainingCallsBadge } from "../components/RemainingCallsBadge";
import { endCall, getCallStatus, sendVoiceTurn, startCall } from "../lib/api";
import { useCountdown } from "../lib/useCountdown";
import { RecordingCancelled, useVoiceRecorder } from "../lib/useVoiceRecorder";
import profile from "../content/profile.json";

type UiState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "wrapping-up"
  | "ended"
  | "blocked"
  | "error";

interface TranscriptEntry {
  role: "agent" | "user";
  text: string;
}

function playAudio(base64: string, mimeType: string): Promise<void> {
  return new Promise((resolve) => {
    const byteChars = atob(base64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
    const audio = new Audio(url);
    const cleanup = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onended = cleanup;
    audio.onerror = cleanup;
    audio.play().catch(cleanup);
  });
}

export default function CallPage() {
  const [uiState, setUiState] = useState<UiState>("idle");
  const [remainingCalls, setRemainingCalls] = useState<number | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const wrappedUpRef = useRef(false);
  const loopActiveRef = useRef(false);

  const { capSeconds } = profile.callWidget;
  const recorder = useVoiceRecorder();
  const countdown = useCountdown(capSeconds, {
    onExpire: () => {
      loopActiveRef.current = false;
      recorder.cancel();
    },
  });

  useEffect(() => {
    getCallStatus()
      .then((s) => setRemainingCalls(s.remainingCalls))
      .finally(() => setStatusLoading(false));
  }, []);

  async function wrapUp() {
    if (wrappedUpRef.current || !sessionIdRef.current) return;
    wrappedUpRef.current = true;
    countdown.stop();
    setUiState("wrapping-up");

    const durationSeconds = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : 0;

    try {
      await endCall({
        sessionId: sessionIdRef.current,
        transcript: transcriptRef.current,
        durationSeconds,
      });
    } finally {
      sessionIdRef.current = null;
      setUiState("ended");
      getCallStatus().then((s) => setRemainingCalls(s.remainingCalls));
    }
  }

  async function runTurnLoop() {
    while (loopActiveRef.current) {
      setUiState("listening");
      let audioBlob: Blob;
      try {
        audioBlob = await recorder.start();
      } catch (err) {
        if (err instanceof RecordingCancelled) break;
        setErrorMessage(err instanceof Error ? err.message : "Couldn't access your microphone.");
        setUiState("error");
        loopActiveRef.current = false;
        break;
      }
      if (!loopActiveRef.current) break;

      setUiState("thinking");
      const reply = await sendVoiceTurn(sessionIdRef.current!, transcriptRef.current, audioBlob);

      if (reply.ended) {
        loopActiveRef.current = false;
        break;
      }
      if (!reply.userText?.trim()) continue; // nothing understood, just keep listening

      transcriptRef.current.push({ role: "user", text: reply.userText });
      transcriptRef.current.push({ role: "agent", text: reply.text! });
      setUiState("speaking");
      await playAudio(reply.audioBase64!, reply.mimeType!);
      if (!loopActiveRef.current) break;
    }
    await wrapUp();
  }

  async function handleStart() {
    setErrorMessage(null);
    setUiState("connecting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMessage("Couldn't access your microphone. Please allow mic permission and try again.");
      setUiState("error");
      return;
    }

    const res = await startCall();
    if (!res.allowed) {
      setUiState("blocked");
      setRemainingCalls(res.remainingCalls);
      setErrorMessage(res.message ?? "Today's call limit has been reached.");
      return;
    }

    sessionIdRef.current = res.sessionId ?? null;
    transcriptRef.current = [];
    startedAtRef.current = Date.now();
    wrappedUpRef.current = false;
    loopActiveRef.current = true;
    setRemainingCalls(res.remainingCalls);
    countdown.start();
    runTurnLoop();
  }

  function handleEndCall() {
    loopActiveRef.current = false;
    recorder.cancel();
  }

  const isActive = ["listening", "thinking", "speaking"].includes(uiState);
  const canStart =
    uiState === "idle" || uiState === "ended" || uiState === "error" || uiState === "blocked";

  const statusText: Record<UiState, string> = {
    idle: "Your AI Assistant",
    connecting: "Connecting…",
    listening: "Listening…",
    thinking: "Thinking…",
    speaking: "Speaking…",
    "wrapping-up": "Wrapping up…",
    ended: "Call ended",
    blocked: "Your AI Assistant",
    error: "Your AI Assistant",
  };

  return (
    <section className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <CallCapNotice className="mb-6 text-left" />

        <div className="mb-4 flex justify-center">
          <RemainingCallsBadge remainingCalls={remainingCalls} loading={statusLoading} />
        </div>

        <div className="relative mx-auto mb-6 h-36 w-36">
          <img
            src={headshotUrl}
            alt={`${profile.meta.name} — AI self avatar`}
            className={`h-36 w-36 rounded-full object-cover ring-4 transition ${
              isActive ? "ring-blue-400 animate-pulse" : "ring-blue-50"
            }`}
          />
        </div>

        <p className="text-lg font-semibold text-slate-900">My AI Self</p>
        <p className="mb-6 text-sm text-slate-500">{statusText[uiState]}</p>

        {isActive && (
          <div className="mb-6">
            <CallCountdown
              secondsLeft={countdown.secondsLeft}
              totalSeconds={capSeconds}
              formatted={countdown.formatted}
            />
          </div>
        )}

        {uiState === "blocked" && (
          <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMessage}
          </p>
        )}
        {uiState === "error" && errorMessage && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}
        {uiState === "ended" && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Thanks for calling! I'll follow up if you left any contact info.
          </p>
        )}

        {isActive ? (
          <button
            onClick={handleEndCall}
            className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            End Call
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={!canStart || (remainingCalls !== null && remainingCalls <= 0)}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uiState === "connecting" || uiState === "wrapping-up" ? "Connecting…" : "Start Call"}
          </button>
        )}
      </div>
    </section>
  );
}
