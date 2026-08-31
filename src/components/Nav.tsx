import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import profile from "../content/profile.json";

const sections: { label: string; hash: string }[] = [
  { label: "About", hash: "#about" },
  { label: "Skills", hash: "#skills" },
  { label: "Projects", hash: "#projects" },
  { label: "Experience", hash: "#experience" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            JT
          </span>
          <span className="font-semibold text-slate-900">{profile.meta.shortName}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link to="/" className="hover:text-slate-900">
            Home
          </Link>
          {sections.map((s) => (
            <HashLink key={s.hash} smooth to={`/${s.hash}`} className="hover:text-slate-900">
              {s.label}
            </HashLink>
          ))}
          <Link to="/contact" className="hover:text-slate-900">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/resume.pdf"
            download
            className="hidden items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 sm:inline-flex"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Resume
          </a>

          <Link
            to="/call"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Call My AI Self
          </Link>
        </div>
      </div>
    </header>
  );
}
