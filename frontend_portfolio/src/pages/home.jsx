import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import LetterReveal, { LetterRevealPlaceholder } from "../components/LetterReveal";

const SNAPSHOT_SKILLS = [
  { label: "Python", level: "Advanced" },
  { label: "FastAPI", level: "Advanced" },
  { label: "Django / Flask", level: "Intermediate" },
  { label: "React + Vite", level: "Intermediate" },
  { label: "OpenAI API", level: "Intermediate" },
  { label: "Cursor AI", level: "Daily workflow" },
  { label: "Git & GitHub", level: "Daily use" },
];

const SKILL_GROUPS = [
  {
    title: "Backend & APIs",
    subtitle: "Business logic, APIs, and automation.",
    icon: "🧠",
    accent: "from-indigo-500 to-sky-400",
    border: "border-indigo-400/40",
    glow: "shadow-[0_0_40px_rgba(99,102,241,0.2)]",
    skills: [
      "Python",
      "FastAPI",
      "Django",
      "Flask",
      "REST APIs",
      "Data Validation",
      "Automation",
    ],
  },
  {
    title: "Databases",
    subtitle: "Persisting data reliably.",
    icon: "💾",
    accent: "from-emerald-500 to-teal-400",
    border: "border-emerald-400/40",
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.18)]",
    skills: ["SQLite3", "Relational: PostgreSQL"],
  },
  {
    title: "Frontend",
    subtitle: "Making APIs feel alive.",
    icon: "🎨",
    accent: "from-fuchsia-500 to-cyan-400",
    border: "border-fuchsia-400/40",
    glow: "shadow-[0_0_40px_rgba(217,70,239,0.18)]",
    skills: ["React", "Redux", "Vite", "HTML", "CSS"],
  },
  {
    title: "Tools & Platforms",
    subtitle: "Shipping, version control, APIs & AI-assisted coding.",
    icon: "🛠️",
    accent: "from-slate-400 to-indigo-400",
    border: "border-cyan-400/40",
    glow: "shadow-[0_0_40px_rgba(34,211,238,0.18)]",
    skills: [
      "Git & GitHub",
      "Render (deploy)",
      "OpenAI API",
      { label: "Cursor AI", featured: true },
    ],
  },
];

const TECH_TAGS =
  "Python · FastAPI · Django · JavaScript · Flask · React · Redux · Vite · HTML · CSS · OpenAI · Cursor AI · Git · SQLite3 · PostgreSQL";

const BIO =
  "I specialize in Python backend engineering — building fast, secure APIs and automation tools with FastAPI, Django, and Flask.\n" +
  "I combine them with React, Vite, and AI integrations to turn ideas into intelligent, working systems.";

/** Warm amber/yellow — matches בס״ד badge tone for readable secondary text on dark bg */
const WARM = "text-amber-200";
const WARM_SOFT = "text-yellow-100";
const WARM_MUTED = "text-amber-300/90";

const BIO_TYPO = `text-base sm:text-lg leading-relaxed ${WARM_SOFT}`;

function skillLabel(skill) {
  return typeof skill === "string" ? skill : skill.label;
}

function SkillChip({ skill }) {
  const label = skillLabel(skill);
  const featured = typeof skill === "object" && skill.featured;

  if (featured) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/90 border border-cyan-300/60 text-cyan-50 shadow-[0_0_16px_rgba(34,211,238,0.35)]">
        <span className="text-cyan-300">✦</span>
        {label}
      </span>
    );
  }

  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-200/10 border border-amber-300/35 ${WARM_SOFT}`}>
      {label}
    </span>
  );
}

const fadeIn = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5 },
};

export default function Home() {
  const [showBSD, setShowBSD] = useState(false);

  return (
    <div className={`page-full-bleed bg-[#030712] ${WARM_SOFT}`}>
      {/* Static background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.35),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_50%,rgba(217,70,239,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_80%,rgba(34,211,238,0.1),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* בס״ד — fixed top-right, clear of left nav */}
      <AnimatePresence>
        {showBSD && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-3 right-3 sm:top-4 sm:right-4 z-40 safe-top"
            aria-label="בס״ד"
          >
            <span
              className="select-none inline-flex items-center rounded-full px-4 py-2 text-sm sm:text-base font-bold tracking-wide
                text-black
                bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200
                border-2 border-amber-400/90
                shadow-[0_0_24px_rgba(251,191,36,0.55),0_4px_12px_rgba(0,0,0,0.35)]"
            >
              בס&quot;ד
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="page-content-pad mx-auto w-full max-w-4xl nav:max-w-5xl">
        {/* ─── HERO ─── */}
        <section className="pt-2 nav:pt-4 pb-12 nav:pb-16">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-indigo-500/30 border border-indigo-300/50 text-indigo-100">
              Portfolio
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-amber-500/25 border border-amber-300/50 text-amber-100">
              Open to Junior Backend Roles
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl nav:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05]">
            <span className="block text-white drop-shadow-sm">David J.</span>
            <span className="block text-white drop-shadow-sm">Gorelashvili</span>
            <span className="mt-3 block text-2xl sm:text-3xl nav:text-4xl font-bold bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">
              Backend Developer
            </span>
          </h1>

          {/* Bio — reserved height + letter reveal (wraps on small screens) */}
          <div className={`relative mt-6 w-full max-w-2xl ${BIO_TYPO}`}>
            <LetterRevealPlaceholder text={BIO} className={BIO_TYPO} />
            <div className={`absolute inset-0 w-full ${BIO_TYPO}`}>
              <LetterReveal text={BIO} onComplete={() => setShowBSD(true)} />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_0_30px_rgba(139,92,246,0.45)] hover:brightness-110 transition"
            >
              View Projects
              <span aria-hidden>↗</span>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-white/30 bg-white/10 text-white hover:bg-white/15 transition"
            >
              Contact
              <span className={`text-[10px] uppercase tracking-widest ${WARM}`}>
                Let&apos;s talk
              </span>
            </Link>
          </div>
        </section>

        {/* ─── SNAPSHOT ─── */}
        <motion.section {...fadeIn} className="mb-14 nav:mb-16">
          <div className="rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-sm p-5 sm:p-6 nav:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.25em] ${WARM}`}>
                  Skill Snapshot
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  What I work with day to day
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/30 border border-indigo-300/40 text-indigo-50">
                  Backend-first
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/25 border border-emerald-300/40 text-emerald-50">
                  Production-minded
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SNAPSHOT_SKILLS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl bg-black/40 border border-white/12 px-4 py-2.5"
                >
                  <span className="text-sm font-medium text-white">{item.label}</span>
                  <span className={`text-[10px] uppercase tracking-wider ${WARM_MUTED}`}>
                    {item.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ─── TECH STACK ─── */}
        <motion.section {...fadeIn} id="skills" className="mb-14 nav:mb-16">
          <div className="mb-8">
            <p className={`text-[10px] font-bold uppercase tracking-[0.25em] ${WARM} mb-2`}>
              Arsenal
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Skills &amp; Tech Stack
            </h2>
            <p className={`mt-3 max-w-2xl text-sm sm:text-base ${WARM_SOFT} leading-relaxed`}>
              I focus on Python backend &amp; APIs, with enough frontend and tooling to ship
              complete, real projects: authentication, stats, external APIs, and clean
              deployment.
            </p>
            <p className={`mt-4 text-[10px] sm:text-xs uppercase tracking-[0.15em] ${WARM} leading-relaxed`}>
              {TECH_TAGS}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SKILL_GROUPS.map((group) => (
              <article
                key={group.title}
                className={`group relative overflow-hidden rounded-2xl border ${group.border} bg-white/[0.04] p-5 sm:p-6 ${group.glow} hover:bg-white/[0.07] transition-colors duration-300`}
              >
                <div
                  className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${group.accent} opacity-25 blur-2xl group-hover:opacity-35 transition-opacity`}
                />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{group.icon}</span>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                      {group.title}
                    </h3>
                  </div>
                  <p className={`text-xs ${WARM_MUTED} mb-4`}>{group.subtitle}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.skills.map((skill) => (
                      <SkillChip key={skillLabel(skill)} skill={skill} />
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </motion.section>

        {/* ─── QUOTE ─── */}
        <motion.footer {...fadeIn} className="flex justify-end pb-4" aria-label="Quote">
          <blockquote
            id="einsteinQuote"
            className="w-full max-w-xs sm:max-w-sm rounded-2xl border border-indigo-400/35 bg-indigo-950/60 px-5 py-4 text-right shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
          >
            <p className={`text-sm italic ${WARM_SOFT} leading-relaxed border-r-2 border-amber-400/50 pr-3`}>
              &ldquo;When the solution is simple, God is answering.&rdquo;
            </p>
            <cite className={`mt-2 block not-italic text-xs ${WARM} pr-3`}>
              — Albert Einstein
            </cite>
          </blockquote>
        </motion.footer>
      </main>
    </div>
  );
}
