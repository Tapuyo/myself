import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import profile from "../content/profile.json";
import { CallWidgetTeaser } from "./CallWidgetTeaser";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
      <div>
        <p className="mb-3 text-blue-600">{profile.hero.greeting} 👋</p>
        <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
          {profile.hero.headline[0]}
          <br />
          <span className="text-blue-600">{profile.hero.headline[1]}</span>
        </h1>
        <p className="mt-5 max-w-md text-slate-600">{profile.hero.subcopy}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/call"
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {profile.hero.primaryCta}
          </Link>
          <HashLink
            smooth
            to="/#projects"
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            {profile.hero.secondaryCta} →
          </HashLink>
        </div>
      </div>

      <div className="flex justify-center">
        <CallWidgetTeaser />
      </div>
    </section>
  );
}
