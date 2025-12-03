import { useState } from "react";
import { motion } from "framer-motion";
import LetterReveal from "../components/LetterReveal";

/* ⬇️ 1) MOVE SNAPSHOT SKILLS OUTSIDE */
const SNAPSHOT_SKILLS = [
  { label: "Python", level: "Advanced" },
  { label: "FastAPI", level: "Advanced" },
  { label: "Django / Flask", level: "Intermediate" },
  { label: "React + Vite", level: "Intermediate" },
  { label: "OpenAI API", level: "Intermediate" },
  { label: "Git & GitHub", level: "Daily use" },
];

/* ⬇️ 2) MOVE SkillSnapshotCard OUTSIDE (so it doesn’t remount on every state change) */
const SkillSnapshotCard = ({ className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.35, duration: 0.6 }}
    className={`
      relative rounded-3xl border border-white/70 dark:border-white/10 
      bg-white/85 dark:bg-slate-900/85
      shadow-[0_20px_50px_rgba(15,23,42,0.35)]
      backdrop-blur px-5 py-6 md:px-6 md:py-7
      overflow-hidden
      ${className}
    `}
  >
    {/* Glow */}
    <div className="pointer-events-none absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/70 via-fuchsia-500/60 to-cyan-400/50 blur-3xl opacity-80" />

    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-neutral-600 dark:text-neutral-400">
            Skill Snapshot
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            What I actually work with day to day.
          </p>
        </div>
        <span className="text-2xl md:text-3xl">⚙️</span>
      </div>

      <div className="space-y-2.5 mt-3">
        {SNAPSHOT_SKILLS.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + idx * 0.04, duration: 0.3 }}
            className="flex items-center justify-between rounded-xl bg-slate-900/3 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 px-3 py-1.5"
          >
            <span className="text-xs md:text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {item.label}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-300">
              {item.level}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Highlighted focus + role line */}
      <div className="mt-5 pt-3 border-t border-white/60 dark:border-white/10 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Focus pill */}
          <span
            className="
              inline-flex items-center gap-2
              rounded-full px-3.5 py-2
              text-[11px] md:text-xs font-semibold
              bg-gradient-to-r from-indigo-600/15 via-indigo-500/15 to-sky-400/15
              border border-indigo-400/80
              text-indigo-900 dark:text-indigo-50
              shadow-[0_0_16px_rgba(79,70,229,0.55)]
            "
          >
            <span className="text-[11px] md:text-[11px] uppercase tracking-[0.2em] opacity-85">
              Focus
            </span>
            <span className="text-[11px] md:text-xs">
              Backend-first, production-minded
            </span>
          </span>

          {/* Role pill with radar pulse */}
          <div className="relative inline-flex">
            {/* Outer pulse 1 */}
            <motion.div
              className="
                pointer-events-none
                absolute inset-0
                -z-10
                rounded-full
                border border-amber-300/80
                bg-amber-300/20
                blur-sm
              "
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: [1, 1.5, 2.1], opacity: [0.7, 0.35, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />

            {/* Outer pulse 2 – staggered */}
            <motion.div
              className="
                pointer-events-none
                absolute inset-0
                -z-20
                rounded-full
                border border-amber-200/70
                bg-amber-200/15
                blur-md
              "
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: [1, 1.7, 2.4], opacity: [0.6, 0.3, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.4,
              }}
            />

            {/* Central pill */}
            <motion.span
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                relative z-10
                inline-flex items-center gap-2
                rounded-full px-3.5 py-2
                text-[11px] md:text-xs font-semibold
                bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500
                border border-amber-300
                text-slate-900
                shadow-[0_0_16px_rgba(250,204,21,0.7)]
              "
            >
              <span className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] opacity-90">
                Role
              </span>
              <span className="text-[11px] md:text-xs whitespace-nowrap">
                Open to Junior / Entry Backend Roles
              </span>
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function HomeInspired() {
  const [showBSD, setShowBSD] = useState(false);
  const [showProjectsButton, setShowProjectsButton] = useState(false);
  const [showProjectsList, setShowProjectsList] = useState(false);

  const PROJECT_TAGS = ["QuizProAI", "Weather", "Smart File Organizer"];

  // Skill groups for main Skills section
  const SKILL_GROUPS = [
    {
      title: "Backend & APIs",
      subtitle: "Business logic, APIs, and automation.",
      icon: "🧠",
      accent: "from-indigo-500/80 via-sky-500/60 to-emerald-400/50",
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
      accent: "from-emerald-500/80 via-lime-500/60 to-teal-400/50",
      skills: ["SQLite3", "Relational: PostgreSQL"],
    },
    {
      title: "Frontend",
      subtitle: "Making APIs feel alive.",
      icon: "🎨",
      accent: "from-fuchsia-500/80 via-pink-500/60 to-cyan-400/50",
      skills: ["React", "Redux", "Vite", "HTML", "CSS"],
    },
    {
      title: "Tools & Platforms",
      subtitle: "Shipping, version control & AI.",
      icon: "🛠️",
      accent: "from-slate-500/80 via-slate-600/60 to-slate-800/60",
      skills: ["Git & GitHub", "Render (deploy)", "OpenAI API"],
    },
  ];

  // Projects rail position
  const PROJECTS_POSITION = {
    leftVW: 65,
    rightOffset: 160,
    topOffset: 340,
    bottomOffset: -60,
  };

  const handleProjectsClick = () => {
    setShowProjectsButton(true);
  };

  const toggleProjectsList = () => {
    setShowProjectsList((prev) => !prev);
  };

  return (
    <div
      className="
      relative min-h-screen overflow-hidden
      bg-slate-50 text-slate-900
      dark:bg-slate-950 dark:text-slate-100
    "
    >
      {/* glowing backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -inset-28 rounded-[40%] bg-gradient-to-tr from-indigo-500/30 via-fuchsia-400/20 to-amber-300/20 blur-3xl"
          animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.05, 0.98, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div
        id="projectsRail"
        className="fixed right-0 top-0 h-screen w-[280px] pointer-events-none"
      />

      {/* hero */}
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        {/* Name, hero, CTAs */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-center md:text-left"
        >
          <span className="block">David J. Gorelashvili</span>
          <span className="mt-2 block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400">
            Backend&nbsp;&nbsp;Developer
          </span>
        </motion.h1>

        <motion.p
          id="heroText"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 max-w-2xl text-lg md:text-xl opacity-80"
        >
          <LetterReveal
            text={
              "I specialize in Python backend engineering — building fast, secure APIs and automation tools with FastAPI, Django, and Flask.\n" +
              "I combine them with React, Vite, and AI integrations to turn ideas into \nintelligent, working systems."
            }
            onComplete={() => setShowBSD(true)}
          />
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          {/* Primary – View Projects */}
          <motion.a
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.97 }}
            href="/projects"
            className="
              inline-flex items-center gap-2
              rounded-full 
              px-6 py-2.5 text-sm font-semibold
              bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400
              text-white
              shadow-[0_0_20px_rgba(129,140,248,0.5)]
              hover:shadow-[0_0_26px_rgba(192,132,252,0.6)]
              transition-all duration-200
            "
          >
            View Projects
            <span className="text-base leading-none">↗</span>
          </motion.a>

          {/* Secondary – Contact */}
          <motion.a
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            href="/contact"
            className="
              inline-flex items-center gap-2
              rounded-full 
              px-5 py-2.5 text-sm font-medium
              border border-indigo-300/70
              bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700
              text-white
              shadow-[0_0_18px_rgba(79,70,229,0.7)]
              hover:brightness-110
              hover:shadow-[0_0_24px_rgba(129,140,248,0.9)]
              transition-all duration-200
            "
          >
            Contact
            <span className="text-xs uppercase tracking-[0.18em] opacity-90">
              Let&apos;s talk
            </span>
          </motion.a>
        </motion.div>

        {/* Mobile Skill Snapshot (under hero) */}
        <div className="mt-10 md:hidden">
          <SkillSnapshotCard />
        </div>

        {/* === Skills & Stack section === */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-14 md:mt-16"
        >
          <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                Skills &amp; Tech Stack
              </h2>
              <p className="mt-2 text-sm md:text-base text-neutral-700 dark:text-neutral-300 max-w-2xl">
                I focus on Python backend & APIs, with enough frontend and tooling
                to ship complete, real projects: authentication, stats, external
                APIs, and clean deployment.
              </p>
            </div>

            <p
              className="
                text-[11px] md:text-xs uppercase tracking-[0.26em]
                text-neutral-500 dark:text-neutral-400
                md:relative md:-top-5 md:left-12
              "
            >
              Python • FastAPI • Django • JavaScript • Flask
              &nbsp; React • Redux Tools • Vite • Html • CSS •
              &nbsp; OpenAI • Git • Sqlite3 • PostgreSQL
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {SKILL_GROUPS.map((group, idx) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  // delay: 0.55 + idx * 0.08,
                  // duration: 0.4,
                  ease: "easeOut",
                }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="
        group
        relative overflow-hidden rounded-2xl 
        border border-white/70 dark:border-white/10
        bg-white/90 dark:bg-slate-950/70 
        shadow-[0_20px_50px_rgba(15,23,42,0.4)]
        backdrop-blur
        p-5 md:p-6
        transition-all duration-200
        hover:border-slate-900/60 dark:hover:border-slate-100/70
        hover:shadow-[0_26px_60px_rgba(15,23,42,0.75)]
      "
              >
                {/* dark spotlight overlay on hover */}
                <div
                  className="
          pointer-events-none
          absolute inset-0 rounded-2xl
          bg-slate-950/90 dark:bg-black
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        "
                />

                {/* gradient glow */}
                <div
                  className={`
          pointer-events-none absolute -right-12 -top-10 w-40 h-40 rounded-full 
          bg-gradient-to-br ${group.accent} blur-3xl 
          opacity-70 group-hover:opacity-100
          transition-opacity duration-200
        `}
                />

                {/* content */}
                <div className="relative z-10">
                  {/* top icon + title */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="inline-flex items-center gap-2 mb-1">
                        <span className="text-xl">{group.icon}</span>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-neutral-700 dark:text-neutral-200">
                          {group.title}
                        </h3>
                      </div>
                      <p className="text-xs md:text-[13px] text-neutral-600/85 dark:text-neutral-300/85">
                        {group.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* skills chips */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <span
                        key={skill}
                        className="
                inline-flex items-center
                px-3 py-1.5 rounded-full
                text-[11px] md:text-xs font-medium
                bg-slate-900/5 dark:bg-black/50
                border border-slate-900/10 dark:border-white/10
                text-slate-800 dark:text-slate-100
                shadow-[0_0_12px_rgba(15,23,42,0.5)]
                transition-all duration-200
                group-hover:bg-slate-900/60 group-hover:border-slate-100/60
                group-hover:text-slate-50
              "
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      {/* Desktop Skill Snapshot – absolute, scrolls with page. 
          You can fully control position via top/right here. */}
      <div
        className="hidden md:block absolute z-20 w-72 xl:w-80"
        style={{
          top: "3rem", // move up/down
          right: "2vw", // move closer/further from right edge
        }}
      >
        <SkillSnapshotCard />
      </div>

      {/* בס״ד */}
      {showBSD && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="fixed top-6 left-6 z-30"
        >
          <span
            className="select-none rounded-full px-3 py-1 text-sm md:text-base font-semibold tracking-wide
                     text-neutral-800 dark:text-neutral-100
                     border border-neutral-300/60 dark:border-neutral-700/60
                     bg-white/40 dark:bg-black/30 backdrop-blur"
          >
            בס&quot;ד
          </span>
        </motion.div>
      )}

      {/* MOBILE: Projects toggle button */}
      {showProjectsButton && (
        <div className="mt-6 flex justify-center md:hidden">
          <button
            onClick={toggleProjectsList}
            className="rounded-full bg-indigo-600 text-white px-5 py-2.5 text-sm font-semibold shadow hover:bg-indigo-500 transition"
          >
            {showProjectsList ? "Hide Projects" : "Show Projects"}
          </button>
        </div>
      )}

      {/* 🟦 Right “Show Projects” button */}
      {showProjectsButton && (
        <motion.button
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          onClick={toggleProjectsList}
          className="fixed z-40 text-white font-semibold px-6 py-3 rounded-full shadow-xl hover:scale-105 transition"
          style={{
            top: "54vh",
            right: "6px",
            background:
              "linear-gradient(135deg, rgba(70,120,255,0.95) 0%, rgba(40,80,230,0.9) 100%)",
            border: "1px solid rgba(180,200,255,0.4)",
          }}
        >
          {showProjectsList ? "Hide Projects" : "Show Projects"}
        </motion.button>
      )}


      {/* Einstein quote */}
      <footer className="fixed right-8 bottom-8 max-w-sm text-sm md:text-base font-medium italic text-neutral-800 dark:text-neutral-200 opacity-90 tracking-wide leading-snug">
        <p
          id="einsteinQuote"
          className="border-l-2 border-neutral-400 dark:border-neutral-600 pl-3"
        >
          “When the solution is simple, God is answering.”
          <br />
          <span className="not-italic text-xs md:text-sm font-normal opacity-75">
            — Albert Einstein
          </span>
        </p>
      </footer>
    </div>
  );
}