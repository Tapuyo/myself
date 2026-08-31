const features = [
  {
    title: "Available 24/7",
    description: "Call anytime, day or night. I'm always here.",
    icon: "clock",
  },
  {
    title: "Ask Anything",
    description: "Projects, skills, experience, or just say hi!",
    icon: "chat",
  },
  {
    title: "AI-Powered",
    description: "Smart responses grounded in my real background.",
    icon: "spark",
  },
  {
    title: "Private & Secure",
    description: "Your conversation stays confidential.",
    icon: "lock",
  },
];

export function FeatureStatsBar() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <FeatureIcon name={f.icon} />
            </span>
            <div>
              <p className="font-semibold text-slate-900">{f.title}</p>
              <p className="text-sm text-slate-500">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureIcon({ name }: { name: string }) {
  const common = "h-5 w-5";
  switch (name) {
    case "clock":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "chat":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.833L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      );
    case "spark":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
      );
    default:
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      );
  }
}
