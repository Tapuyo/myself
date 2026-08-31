import profile from "../content/profile.json";

interface Props {
  remainingCalls: number | null;
  loading?: boolean;
}

export function RemainingCallsBadge({ remainingCalls, loading }: Props) {
  const max = profile.callWidget.maxCallsPerDay;

  if (loading || remainingCalls === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
        Checking today's availability…
      </span>
    );
  }

  const usedUp = remainingCalls <= 0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        usedUp ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {usedUp
        ? `You've used today's ${max} calls — come back tomorrow`
        : `${remainingCalls} of ${max} calls left today`}
    </span>
  );
}
