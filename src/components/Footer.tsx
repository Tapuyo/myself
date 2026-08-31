import profile from "../content/profile.json";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row">
        <p>
          © {new Date().getFullYear()} {profile.meta.name}. All rights reserved.
        </p>
        <a href={`mailto:${profile.meta.email}`} className="hover:text-slate-700">
          {profile.meta.email}
        </a>
      </div>
    </footer>
  );
}
