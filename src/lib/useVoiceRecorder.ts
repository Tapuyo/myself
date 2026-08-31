import { useCallback, useRef, useState } from "react";

interface UseVoiceRecorderOptions {
  /** RMS amplitude (0-128 scale) below which audio counts as silence. */
  silenceThreshold?: number;
  /** How long continuous silence must persist before auto-stopping. */
  silenceDurationMs?: number;
  /** Minimum recording time before silence is allowed to trigger a stop. */
  minRecordingMs?: number;
  /** Hard safety cap in case silence detection never fires. */
  maxRecordingMs?: number;
}

export class RecordingCancelled extends Error {
  constructor() {
    super("Recording was cancelled");
    this.name = "RecordingCancelled";
  }
}

/** Records mic audio, auto-stopping after a pause in speech. */
export function useVoiceRecorder({
  silenceThreshold = 6,
  silenceDurationMs = 2200,
  minRecordingMs = 400,
  maxRecordingMs = 60000,
}: UseVoiceRecorderOptions = {}) {
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const start = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      let cancelled = false;
      let rafId: number | null = null;
      let audioCtx: AudioContext | null = null;
      let stream: MediaStream | null = null;

      const cleanup = () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        stream?.getTracks().forEach((t) => t.stop());
        audioCtx?.close().catch(() => {});
        setListening(false);
        setLevel(0);
        cleanupRef.current = null;
      };

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((mediaStream) => {
          stream = mediaStream;
          const recorder = new MediaRecorder(mediaStream);
          const chunks: Blob[] = [];
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          recorder.onstop = () => {
            cleanup();
            if (cancelled) {
              reject(new RecordingCancelled());
            } else {
              resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
            }
          };

          audioCtx = new AudioContext();
          const source = audioCtx.createMediaStreamSource(mediaStream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 2048;
          source.connect(analyser);
          const data = new Uint8Array(analyser.fftSize);

          const startTime = Date.now();
          let silenceStart: number | null = null;
          let lastLevelUpdate = 0;

          const tick = () => {
            analyser.getByteTimeDomainData(data);
            let sumSquares = 0;
            for (let i = 0; i < data.length; i++) {
              const v = data[i] - 128;
              sumSquares += v * v;
            }
            const rms = Math.sqrt(sumSquares / data.length);
            const now = Date.now();
            const elapsed = now - startTime;

            // Throttle React state updates to ~10/sec — smooth enough for a
            // visual meter without flooding re-renders at animation-frame rate.
            if (now - lastLevelUpdate >= 100) {
              lastLevelUpdate = now;
              setLevel(Math.min(1, rms / 50));
            }

            if (elapsed >= maxRecordingMs) {
              recorder.stop();
              return;
            }

            if (rms < silenceThreshold) {
              if (silenceStart === null) silenceStart = Date.now();
              else if (elapsed >= minRecordingMs && Date.now() - silenceStart >= silenceDurationMs) {
                recorder.stop();
                return;
              }
            } else {
              silenceStart = null;
            }

            rafId = requestAnimationFrame(tick);
          };

          cleanupRef.current = () => {
            cancelled = true;
            if (recorder.state !== "inactive") recorder.stop();
            else cleanup();
          };

          recorder.start();
          setListening(true);
          rafId = requestAnimationFrame(tick);
        })
        .catch((err) => {
          cleanup();
          reject(err);
        });
    });
  }, [maxRecordingMs, minRecordingMs, silenceDurationMs, silenceThreshold]);

  /** Stops the in-progress recording and rejects its promise with RecordingCancelled. */
  const cancel = useCallback(() => {
    cleanupRef.current?.();
  }, []);

  return { start, cancel, listening, level };
}
