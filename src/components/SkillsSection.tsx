import profile from "../content/profile.json";

export function SkillsSection() {
  return (
    <section id="skills" className="scroll-mt-24 bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
          What I Do
        </p>
        <h2 className="mb-10 text-3xl font-bold text-slate-900">
          Turning AI ideas into <span className="text-blue-600">real systems.</span>
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {profile.skillCategories.map((cat) => (
            <div key={cat.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 font-semibold text-slate-900">{cat.title}</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {cat.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-blue-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
