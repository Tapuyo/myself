import { Link } from "react-router-dom";
import { AboutSection } from "../components/AboutSection";
import { CallCapNotice } from "../components/CallCapNotice";
import { ExperienceTimeline } from "../components/ExperienceTimeline";
import { FeatureStatsBar } from "../components/FeatureStatsBar";
import { Hero } from "../components/Hero";
import { ProjectsSection } from "../components/ProjectsSection";
import { SkillsSection } from "../components/SkillsSection";
import { TechStack } from "../components/TechStack";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="mx-auto max-w-6xl px-6">
        <CallCapNotice className="mx-auto max-w-md" />
      </div>
      <FeatureStatsBar />
      <AboutSection />
      <SkillsSection />
      <ProjectsSection />
      <ExperienceTimeline />
      <TechStack />

      <section className="bg-blue-600">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 text-center md:flex-row md:text-left">
          <div>
            <p className="text-lg font-semibold text-white">
              Let's build something amazing together.
            </p>
            <p className="text-blue-100">Or just call my AI self first and let's talk!</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/call"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Call My AI Self
            </Link>
            <Link
              to="/contact"
              className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Send Message
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
