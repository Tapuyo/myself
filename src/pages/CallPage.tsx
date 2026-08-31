import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useEffect, useRef, useState } from "react";
import { headshotUrl } from "../assets/images";
import { CallCapNotice } from "../components/CallCapNotice";
import { CallCountdown } from "../components/CallCountdown";
import { RemainingCallsBadge } from "../components/RemainingCallsBadge";
import { endCall, getCallStatus, startCall } from "../lib/api";
import { useCountdown } from "../lib/useCountdown";
import profile from "../content/profile.json";

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined;

type UiState =
  | "idle"
  | "connecting"
  | "connected"
  | "wrapping-up"
  | "ended"
  | "blocked"
  | "error";

interface TranscriptEntry {
  role: "agent" | "user";
  text: string;
}

function CallExperience() {
  const [uiState, setUiState] = useState<UiState>("idle");
  const [remainingCalls, setRemainingCalls] = useState<number | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const connectedAtRef = useRef<number | null>(null);
  const wrappedUpRef = useRef(false);

  const { capSeconds } = profile.callWidget;
  const countdown = useCountdown(capSeconds, {
    onExpire: () => {
      conversation.endSession();
    },
  });

  const conversation = useConversation({
    onConnect: async () => {
      wrappedUpRef.current = false;
      transcriptRef.current = [];
      connectedAtRef.current = Date.now();

      const res = await startCall();
      if (!res.allowed) {
        setUiState("blocked");
        setRemainingCalls(res.remainingCalls);
        setErrorMessage(res.message ?? "Today's call limit has been reached.");
        conversation.endSession();
        return;
      }

      sessionIdRef.current = res.sessionId ?? null;
      setRemainingCalls(res.remainingCalls);
      setUiState("connected");
      countdown.start();
    },
    onMessage: ({ message, role }) => {
      transcriptRef.current.push({ role, text: message });
    },
    onDisconnect: async () => {
      countdown.stop();
      if (wrappedUpRef.current || !sessionIdRef.current) {
        if (uiState !== "blocked") setUiState("idle");
        return;
      }
      wrappedUpRef.current = true;
      setUiState("wrapping-up");

      const durationSeconds = connectedAtRef.current
        ? Math.round((Date.now() - connectedAtRef.current) / 1000)
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
    },
    onError: (message) => {
      setErrorMessage(message);
      setUiState("error");
    },
  });

  useEffect(() => {
    getCallStatus()
      .then((s) => setRemainingCalls(s.remainingCalls))
      .finally(() => setStatusLoading(false));
  }, []);

  async function handleStart() {
    setErrorMessage(null);
    setUiState("connecting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!AGENT_ID) throw new Error("Voice agent is not configured yet.");
      await conversation.startSession({ agentId: AGENT_ID });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Couldn't access your microphone.",
      );
      setUiState("error");
    }
  }

  const isConnected = uiState === "connected";
  const canStart =
    uiState === "idle" || uiState === "ended" || uiState === "error" || uiState === "blocked";

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
              isConnected ? "ring-blue-400 animate-pulse" : "ring-blue-50"
            }`}
          />
        </div>

        <p className="text-lg font-semibold text-slate-900">My AI Self</p>
        <p className="mb-6 text-sm text-slate-500">
          {isConnected ? "Listening…" : "Your AI Assistant"}
        </p>

        {isConnected && (
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
        {uiState === "wrapping-up" && (
          <p className="mb-4 text-sm text-slate-500">Wrapping up the call…</p>
        )}
        {uiState === "ended" && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Thanks for calling! I'll follow up if you left any contact info.
          </p>
        )}
        {!AGENT_ID && (
          <p className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Voice agent isn't configured yet — set VITE_ELEVENLABS_AGENT_ID to enable calls.
          </p>
        )}

        {isConnected ? (
          <button
            onClick={() => conversation.endSession()}
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
            {uiState === "connecting" ? "Connecting…" : "Start Call"}
          </button>
        )}
      </div>
    </section>
  );
}

export default function CallPage() {
  return (
    <ConversationProvider>
      <CallExperience />
    </ConversationProvider>
  );
}
