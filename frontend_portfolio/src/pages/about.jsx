import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../config/api";

export default function About() {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/about`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load profile");
        return res.json();
      })
      .then((data) => setInfo(data))
      .catch((e) => setError(e.message || "Failed to load"));
  }, []);

  if (error) {
    return (
      <div className="page-full-bleed page-content-pad flex items-center justify-center text-neutral-700 dark:text-neutral-200">
        <p className="text-center text-sm sm:text-base">{error}</p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="page-full-bleed page-content-pad flex items-center justify-center text-neutral-600 dark:text-neutral-300">
        <p className="animate-pulse text-sm sm:text-base">Loading…</p>
      </div>
    );
  }

  return (
    <div className="page-full-bleed bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="page-content-pad mx-auto max-w-3xl">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400 mb-2">
            About
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight break-words">
            {info.name}
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-indigo-600 dark:text-cyan-300 font-medium">
            {info.title}
          </p>
          {info.location && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              📍 {info.location}
            </p>
          )}
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur p-5 sm:p-6 md:p-8 shadow-lg mb-8"
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-3">
            Summary
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-neutral-700 dark:text-neutral-200">
            {info.summary}
          </p>
        </motion.section>

        {Array.isArray(info.skills) && info.skills.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4">
              Skills
            </h2>
            <ul className="flex flex-wrap gap-2">
              {info.skills.map((skill) => (
                <li
                  key={skill}
                  className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-slate-900/5 dark:bg-white/10 border border-slate-900/10 dark:border-white/15"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </motion.section>
        )}
      </main>
    </div>
  );
}
