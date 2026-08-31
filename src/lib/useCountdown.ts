import { useCallback, useEffect, useRef, useState } from "react";

interface UseCountdownOptions {
  onExpire?: () => void;
}

/** Counts down from `totalSeconds` once `start()` is called. */
export function useCountdown(totalSeconds: number, { onExpire }: UseCountdownOptions = {}) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    setSecondsLeft(totalSeconds);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clear();
          setRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clear, totalSeconds]);

  const stop = useCallback(() => {
    clear();
    setRunning(false);
  }, [clear]);

  useEffect(() => clear, [clear]);

  const formatted = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return { secondsLeft, formatted, running, start, stop };
}
