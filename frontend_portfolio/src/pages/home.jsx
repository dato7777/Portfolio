import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import LetterReveal from "../components/LetterReveal"; // ensure this handles \n -> <br />
import SkillsRandomWall from "../components/SkillsRandomWall";

export default function HomeInspired() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("prefersDark");
    return saved ? JSON.parse(saved) : true;
  });
  const [showBSD, setShowBSD] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const SKILL_TAGS = [
    "Python", "FastAPI", "Django", "Flask",
    "SQLite3", "PostgreSQL", "SQLModel", "SQL",
    "OpenAI API", "Automation", "REST APIs", "Data Validation",
    "React", "Redux", "Vite", "Tailwind CSS",
    "Framer Motion", "Axios", "Playwright",
    "Git & GitHub", "Render (deploy)",
    "Shopify", "Liquid", "CJdropshipping",
  ];
  const SKILL_ZONE = [
  // x in vw, y in px  (feel free to nudge numbers)
  { x: "52vw", y: 310 },  // near after “Developer”
  { x: "74vw", y: 300 },
  { x: "88vw", y: 210 },
  { x: "94vw", y: 210 },  // near right curve top
  { x: "94vw", y: 640 },  // right column down
  { x: "72vw", y: 660 },
  { x: "54vw", y: 640 },
  { x: "48vw", y: 560 },  // bulge left under CTAs
  { x: "46vw", y: 500 },
  { x: "48vw", y: 440 },
];
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("prefersDark", JSON.stringify(dark));
  }, [dark]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* animated background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -inset-28 rounded-[40%] bg-gradient-to-tr from-indigo-500/30 via-fuchsia-400/20 to-amber-300/20 blur-3xl"
          animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.05, 0.98, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.06),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,.04),transparent_35%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,.35),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(0,0,0,.25),transparent_35%)]" />
      </div>

      {/* theme toggle */}
      <button
        onClick={() => setDark((d) => !d)}
        className="fixed left-6 bottom-6 rounded-full border border-neutral-300/50 dark:border-neutral-700/60 px-3 py-1.5 text-xs backdrop-blur bg-white/40 dark:bg-black/30 hover:scale-[1.03] transition"
      >
        {dark ? "Light mode" : "Dark mode"}
      </button>
      <div id="projectsRail" className="fixed right-0 top-0 h-screen w-[280px] pointer-events-none" />

      {/* hero center */}
      <main className="mx-auto max-w-7xl px-6 pt-28 md:pt-36">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight"
        >
          <span className="block" id="heroName">David J. Gorelashvili</span>
          <span className="mt-2 block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400">
            Backend&nbsp;&nbsp;Developer
          </span>
        </motion.h1>

        <motion.p
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

        {/* CTA buttons */}
        <motion.div id="ctaSection"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <a
            href="/projects"
            className="rounded-full border border-neutral-300/60 dark:border-neutral-700/60 px-5 py-2.5 text-sm hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition"
          >
            View Projects
          </a>
          <a
            href="/contact"
            className="rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black px-5 py-2.5 text-sm hover:scale-[1.02] transition"
          >
            Contact
          </a>
        </motion.div>
      </main>

      {/* top-left בס"ד — appears AFTER text finishes */}
      {showBSD && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          onAnimationComplete={() => setShowSkills(true)}   // 👈 chain to skills
          className="fixed top-6 left-6 z-30"
        >
          <span className="select-none rounded-full px-3 py-1 text-sm md:text-base font-semibold tracking-wide
                     text-neutral-800 dark:text-neutral-100
                     border border-neutral-300/60 dark:border-neutral-700/60
                     bg-white/40 dark:bg-black/30 backdrop-blur">
            בס"ד
          </span>
        </motion.div>
      )}
      {showSkills && (
        <SkillsRandomWall
          show
          tags={SKILL_TAGS}
          anchorRightId="projectsRail"         // right boundary = that “white/red line”
          anchorTopId="heroName"              // top = bottom of your name
          anchorBottomIds={["einsteinQuote"]} 
          polygon={SKILL_ZONE}
          leftVW={48} rightPx={24}            // fallbacks if no anchors
          delayStart={0.35} perItemDelay={0.25}
          // cycle
          // cycleInterval={2.6}
          // stopAfterOnePass={true}
        />
      )}




      {/* bottom-right quote */}
      <footer className="fixed right-8 bottom-8 max-w-sm text-sm md:text-base font-medium italic text-neutral-800 dark:text-neutral-200 opacity-90 tracking-wide leading-snug">
        <p id="einsteinQuote" className="border-l-2 border-neutral-400 dark:border-neutral-600 pl-3">
          “When the solution is simple, God is answering.”
          <br />
          <span className="not-italic text-xs md:text-sm font-normal opacity-75">— Albert Einstein</span>
        </p>
      </footer>
    </div>
  );
}
