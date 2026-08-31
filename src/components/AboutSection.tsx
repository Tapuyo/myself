import { portraitUrl } from "../assets/images";
import profile from "../content/profile.json";

export function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <img
          src={portraitUrl}
          alt={profile.meta.name}
          className="mx-auto h-[480px] w-full max-w-sm rounded-2xl object-cover object-top shadow-md"
        />

        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
            About Me
          </p>
          <h2 className="text-3xl font-bold text-slate-900">
            An engineer who turns <span className="text-blue-600">AI ideas</span> into shipped
            products.
          </h2>
          <p className="mt-4 text-slate-600">{profile.summary}</p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {profile.stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
