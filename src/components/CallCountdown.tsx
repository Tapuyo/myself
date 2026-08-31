interface Props {
  secondsLeft: number;
  totalSeconds: number;
  formatted: string;
}

export function CallCountdown({ secondsLeft, totalSeconds, formatted }: Props) {
  const pct = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const low = secondsLeft <= 30;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${low ? "bg-red-500" : "bg-blue-500"}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <p className={`font-mono text-sm ${low ? "text-red-600" : "text-slate-500"}`}>
        {formatted} remaining
      </p>
    </div>
  );
}
