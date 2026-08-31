export interface Profile {
  meta: {
    name: string;
    shortName: string;
    title: string;
    location: string;
    email: string;
    phone: string;
    website: string;
  };
  hero: {
    greeting: string;
    headline: string[];
    subcopy: string;
    primaryCta: string;
    secondaryCta: string;
  };
  summary: string;
  stats: { label: string; value: string }[];
  whatIDo: { id: string; title: string; description: string }[];
  skillCategories: { id: string; title: string; items: string[] }[];
  tools: string[];
  techStack: string[];
  experience: {
    company: string;
    role: string;
    period: string;
    projects?: string[];
    tech?: string[];
    highlights: string[];
  }[];
  projects: { title: string; description: string }[];
  education: { school: string; degree: string; period: string }[];
  areasOfExpertise: string[];
  callWidget: {
    readyStatusText: string;
    privacyNotice: string;
    capSeconds: number;
    capLabel: string;
    maxCallsPerDay: number;
  };
}
