import profile from "../content/profile.json";

export function TechStack() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
        Tech I Use
      </p>
      <h2 className="mb-8 text-3xl font-bold text-slate-900">
        AI engineering meets full-stack delivery.
      </h2>

      <div className="flex flex-wrap gap-3">
        {profile.techStack.map((t) => (
          <span
            key={t}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
          >
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
