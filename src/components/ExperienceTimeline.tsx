import profile from "../content/profile.json";

export function ExperienceTimeline() {
  return (
    <section id="experience" className="scroll-mt-24 bg-slate-50 py-16">
      <div className="mx-auto max-w-4xl px-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
          Experience
        </p>
        <h2 className="mb-10 text-3xl font-bold text-slate-900">Where I've worked.</h2>

        <ol className="space-y-8 border-l border-slate-200 pl-6">
          {profile.experience.map((job) => (
            <li key={`${job.company}-${job.period}`} className="relative">
              <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {job.period}
              </p>
              <h3 className="mt-1 font-semibold text-slate-900">
                {job.role} · {job.company}
              </h3>
              {job.tech && (
                <p className="mt-1 text-xs text-slate-500">{job.tech.join(", ")}</p>
              )}
              {job.highlights.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {job.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-slate-400" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
