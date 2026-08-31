import profile from "../content/profile.json";

export function ProjectsSection() {
  return (
    <section id="projects" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
        Selected AI &amp; Automation Projects
      </p>
      <h2 className="mb-10 text-3xl font-bold text-slate-900">Recent work worth a look.</h2>

      <div className="grid gap-6 md:grid-cols-3">
        {profile.projects.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h3 className="mb-2 font-semibold text-slate-900">{p.title}</h3>
            <p className="text-sm text-slate-600">{p.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
