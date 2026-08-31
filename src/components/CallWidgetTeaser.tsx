import { Link } from "react-router-dom";
import { headshotUrl } from "../assets/images";
import profile from "../content/profile.json";

export function CallWidgetTeaser() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="mb-4 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {profile.callWidget.readyStatusText}
        </span>
      </div>

      <div className="relative mx-auto mb-4 h-32 w-32">
        <img
          src={headshotUrl}
          alt={`${profile.meta.name} — AI self avatar`}
          className="h-32 w-32 rounded-full object-cover ring-4 ring-blue-50"
        />
      </div>

      <p className="text-center text-lg font-semibold text-slate-900">My AI Self</p>
      <p className="mb-5 text-center text-sm text-slate-500">Your AI Assistant</p>

      <Link
        to="/call"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.36 11.36 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.57 1 1 0 01-.25 1.02l-2.2 2.2z" />
        </svg>
        Tap to Call
      </Link>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
        <span>Available 24/7</span>
        <span>&middot;</span>
        <span>Calls are private &amp; secure</span>
      </div>
    </div>
  );
}
