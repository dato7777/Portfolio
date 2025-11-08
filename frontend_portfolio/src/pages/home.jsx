// src/pages/HomeInspired.jsx

// src/pages/HomeInspired.jsx
// src/pages/HomeInspired.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import LetterReveal from "../components/LetterReveal";
import SkillsColumns from "../components/SkillsColumns";

export default function HomeInspired() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("prefersDark");
    return saved ? JSON.parse(saved) : true;
  });

  const [showBSD, setShowBSD] = useState(false);       // after LetterReveal
  const [showButton, setShowButton] = useState(false); // shown after BSD anim completes
  const [showSkills, setShowSkills] = useState(false);

  const SKILL_TAGS = [
    "Python", "FastAPI", "Django", "Flask",
    "SQLite3", 
    "OpenAI API", "Automation", "REST APIs", "Data Validation",
    "React", "Redux", "Vite", 
     "Git & GitHub", "Render (deploy)",
  ];

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("prefersDark", JSON.stringify(dark));
  }, [dark]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* subtle glowing backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -inset-28 rounded-[40%] bg-gradient-to-tr from-indigo-500/30 via-fuchsia-400/20 to-amber-300/20 blur-3xl"
          animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.05, 0.98, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* theme toggle */}
      <button
        onClick={() => setDark((d) => !d)}
        className="fixed left-6 bottom-6 rounded-full border border-neutral-300/50 dark:border-neutral-700/60 px-3 py-1.5 text-xs backdrop-blur bg-white/40 dark:bg-black/30 hover:scale-[1.03] transition"
      >
        {dark ? "Light mode" : "Dark mode"}
      </button>

      {/* right boundary marker for future projects rail */}
      <div id="projectsRail" className="fixed right-0 top-0 h-screen w-[280px] pointer-events-none" />

      {/* hero */}
      <main className="mx-auto max-w-7xl px-6 pt-24 md:pt-28">
        {/* --- ZERO-LAYOUT-SHIFT BUTTON ZONE --- */}
        {/* Reserved space; the animated button & rings are absolutely positioned inside */}
        <div className="relative h-28 md:h-32 w-full mb-4 md:mb-6 flex justify-center">
          {showButton && (
            <div className="relative">
              {/* 💥 Stronger pulsing rings behind the button (soundbeat vibe) */}
              {/* Ring A (fast) */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: 180,
                  height: 180,
                  background:
                    "radial-gradient(circle, rgba(120,170,255,0.40) 0%, rgba(120,170,255,0.18) 55%, rgba(120,170,255,0) 70%)",
                  filter: "blur(1.5px)",
                }}
                animate={{ scale: [0.7, 1.35, 1.8], opacity: [0.55, 0.35, 0] }}
                transition={{ duration: 1.6, ease: "easeOut", repeat: Infinity, repeatDelay: 0.1 }}
              />
              {/* Ring B (medium, offset) */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: 230,
                  height: 230,
                  background:
                    "radial-gradient(circle, rgba(90,140,240,0.34) 0%, rgba(90,140,240,0.16) 55%, rgba(90,140,240,0) 75%)",
                  filter: "blur(2px)",
                }}
                animate={{ scale: [0.6, 1.25, 1.7], opacity: [0.45, 0.28, 0] }}
                transition={{ duration: 1.9, ease: "easeOut", repeat: Infinity, repeatDelay: 0.2 }}
              />
              {/* Ring C (larger, slower) */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: 280,
                  height: 280,
                  background:
                    "radial-gradient(circle, rgba(70,120,235,0.26) 0%, rgba(70,120,235,0.12) 55%, rgba(70,120,235,0) 80%)",
                  filter: "blur(3px)",
                }}
                animate={{ scale: [0.55, 1.2, 1.65], opacity: [0.38, 0.22, 0] }}
                transition={{ duration: 2.2, ease: "easeOut", repeat: Infinity, repeatDelay: 0.25 }}
              />

              {/* 🔘 the button itself (slides down once; strong breathing + glow loop) */}
              <motion.button
                key="show-skills-btn"
                initial={{ y: -42, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  // stronger breathing pulse + glow
                  scale: [1, 1.06, 1],
                  boxShadow: [
                    "0 10px 26px rgba(60,110,210,0.45), 0 0 16px rgba(140,190,255,0.25), inset 0 0 16px rgba(255,255,255,0.20)",
                    "0 16px 36px rgba(70,130,230,0.60), 0 0 28px rgba(150,200,255,0.38), inset 0 0 22px rgba(255,255,255,0.28)",
                    "0 10px 26px rgba(60,110,210,0.45), 0 0 16px rgba(140,190,255,0.25), inset 0 0 16px rgba(255,255,255,0.20)",
                  ],
                }}
                transition={{
                  type: "spring",
                  stiffness: 230,
                  damping: 22,
                  // breathing loop timings
                  scale: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
                  boxShadow: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
                }}
                onClick={() => setShowSkills((s) => !s)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                className="absolute left-1/2 -translate-x-1/2 top-0 rounded-full 
                           px-9 md:px-11 py-4.5 md:py-5.5 text-base md:text-lg font-semibold
                           text-white transition-all select-none"
                style={{
                  // semi-transparent classy blue sphere
                  background:
                    "radial-gradient(circle at 40% 35%, rgba(120,180,255,0.90) 0%, rgba(80,130,230,0.78) 45%, rgba(60,110,210,0.66) 80%)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(160,200,255,0.55)",
                }}
              >
                {showSkills ? "Hide Skills" : "Show Skills"}
              </motion.button>
            </div>
          )}
        </div>
        {/* --- /button zone --- */}

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

      {/* בס״ד (after text reveal) */}
      {showBSD && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="fixed top-6 left-6 z-30"
          onAnimationComplete={() => {
            // reveal button AFTER BSD finishes; no layout shift (space reserved)
            setTimeout(() => setShowButton(true), 120);
          }}
        >
          <span className="select-none rounded-full px-3 py-1 text-sm md:text-base font-semibold tracking-wide
                     text-neutral-800 dark:text-neutral-100
                     border border-neutral-300/60 dark:border-neutral-700/60
                     bg-white/40 dark:bg-black/30 backdrop-blur">
            בס"ד
          </span>
        </motion.div>
      )}

      {/* Skills */}
      {showSkills && (
        <SkillsColumns
          show
          tags={SKILL_TAGS}
          anchorRightId="projectsRail"
          leftVW={65}
          topOffset={-80}
          bottomOffset={-60}
          rightOffset={160}
          baseDelay={0.25}
          perItemDelay={0.18}
        />
      )}

      {/* quote */}
      <footer className="fixed right-8 bottom-8 max-w-sm text-sm md:text-base font-medium italic text-neutral-800 dark:text-neutral-200 opacity-90 tracking-wide leading-snug">
        <p id="einsteinQuote" className="border-l-2 border-neutral-400 dark:border-neutral-600 pl-3">
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
