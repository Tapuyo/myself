import { ContactForm } from "../components/ContactForm";
import profile from "../content/profile.json";

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <p className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-blue-600">
        Get In Touch
      </p>
      <h1 className="mb-3 text-center text-3xl font-bold text-slate-900">Send Me a Message</h1>
      <p className="mb-10 text-center text-slate-600">
        Prefer talking things through? Send a message here and I'll follow up, or{" "}
        <a href={`mailto:${profile.meta.email}`} className="text-blue-600 hover:underline">
          email me directly
        </a>
        .
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <ContactForm />
      </div>
    </section>
  );
}
