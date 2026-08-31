import profile from "../content/profile.json";

export function CallCapNotice({ className = "" }: { className?: string }) {
  const { privacyNotice, capLabel } = profile.callWidget;
  return (
    <div
      className={`flex items-start gap-2 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500 ${className}`}
    >
      <svg
        className="mt-0.5 h-4 w-4 flex-none text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      <span>
        {privacyNotice} {capLabel}
      </span>
    </div>
  );
}
