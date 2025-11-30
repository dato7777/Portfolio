// src/components/UserStatsBar.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence, px } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function UserStatsBar({ stats }) {
  // which dropdown is open: "results" | "categories" | null
  const [open, setOpen] = useState(null);
  const [username, setUsername] = useState("Guest");
  const navigate = useNavigate();

  // Read username from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("authUsername");
      if (stored && stored.trim()) {
        setUsername(stored);
      }
    } catch (e) {
      console.warn("Could not read username from localStorage", e);
    }
  }, []);

  const toggle = (which) => {
    setOpen((prev) => (prev === which ? null : which));
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUsername");
    } catch (e) {
      console.warn("Error clearing localStorage on sign-out", e);
    }

    setUsername("Guest");
    setOpen(null);
    navigate("/login");
  };

  const accuracy =
    stats && stats.questionsAnswered
      ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
      : 0;

  // Nice sorted list for per-category (most played first)
  const perCategorySorted = (stats?.perCategory || [])
    .slice()
    .sort((a, b) => b.questionsAnswered - a.questionsAnswered);

  return (
    <div className="mb-8">
      {/* Top strip */}
      <motion.div
        className="
          flex flex-col md:flex-row md:items-center md:justify-between 
          gap-3 px-5 py-3 rounded-2xl 
          bg-white/5 border border-cyan-400/40 
          shadow-[0_0_18px_rgba(0,255,255,0.2)]
          backdrop-blur
        "
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Left: logged-in user */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-cyan-500/40 border border-cyan-300/70 flex items-center justify-center text-xl">
            <span>👤</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-cyan-200/80">
              Logged in as
            </span>
            <span className="text-lg font-semibold text-cyan-50">
              {username}
            </span>
          </div>
        </div>

        {/* Right: buttons */}
        <div className="flex flex-wrap gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => toggle("results")}
            className={`
              px-4 py-2 rounded-full text-sm font-semibold
              border border-yellow-300/60
              bg-yellow-400/10 text-yellow-100
              shadow-[0_0_12px_rgba(255,255,0,0.25)]
              transition
              ${open === "results" ? "bg-yellow-400/20" : "hover:bg-yellow-400/20"}
            `}
          >
            Result Stats
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => toggle("categories")}
            className={`
              px-4 py-2 rounded-full text-sm font-semibold
              border border-cyan-300/60
              bg-cyan-400/10 text-cyan-100
              shadow-[0_0_12px_rgba(0,255,255,0.25)]
              transition
              ${open === "categories" ? "bg-cyan-400/20" : "hover:bg-cyan-400/20"}
            `}
          >
            Categories Tested
          </motion.button>

          {/* 🔴 Sign Out button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSignOut}
            className="
              px-4 py-2 rounded-full text-sm font-semibold
              border border-red-400/70
              bg-red-500/15 text-red-100
              shadow-[0_0_12px_rgba(255,0,0,0.35)]
              hover:bg-red-500/25
              transition
            "
          >
            Sign Out
          </motion.button>
        </div>
      </motion.div>

      {/* Dropdowns */}
      <AnimatePresence mode="wait">
        {/* ================== GLOBAL RESULT STATS ================== */}
        {open === "results" && (
          <motion.div
            key="results-panel"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="
              mt-3 rounded-2xl p-5 
              bg-black/40 border border-yellow-300/40 
              shadow-[0_0_18px_rgba(255,255,0,0.18)]
              backdrop-blur
              text-sm text-yellow-50
            "
          >
            <div className="flex flex-wrap gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-yellow-200/80">
                  Questions Answered
                </div>
                <div className="text-2xl font-bold text-yellow-300">
                  {stats?.questionsAnswered ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-green-200/80">
                  Correct Answers
                </div>
                <div className="text-2xl font-bold text-green-300">
                  {stats?.correctAnswers ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-cyan-200/80">
                  Accuracy
                </div>
                <div className="text-2xl font-bold text-cyan-300">
                  {accuracy}%
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-indigo-200/80">
                  Avg Time / Question
                </div>
                <div className="text-lg font-semibold text-indigo-200">
                  {stats?.avgTimePerQuestion
                    ? `${stats.avgTimePerQuestion.toFixed(1)} s`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-pink-200/80">
                  Current Streak
                </div>
                <div className="text-2xl font-bold text-pink-300">
                  {stats?.streak ?? 0}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================== PER-CATEGORY STATS (FANCY) ================== */}
        {open === "categories" && (
          <motion.div
            key="categories-panel"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="
              mt-3 rounded-2xl p-6 
              bg-black/50 border border-cyan-300/40 
              shadow-[0_0_26px_rgba(0,255,255,0.25)]
              backdrop-blur
              text-cyan-50
            "
          >
            {perCategorySorted.length > 0 ? (
              <>
                {/* Header */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold tracking-wide text-cyan-100">
                      Performance by Category
                    </h3>
                    <p className="text-xs text-cyan-200/70">
                      Bigger cards = more questions. Colors & bars = accuracy at a glance.
                    </p>
                  </div>
                  <div className="text-xs text-right text-cyan-200/70">
                    Total categories played:{" "}
                    <span className="font-semibold text-cyan-100">
                      {perCategorySorted.length}

                    </span>
                  </div>
                </div>

                {/* Grid of large colorful cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {perCategorySorted.map((cat, idx) => {
                    const barWidth = `${Math.min(Math.max(cat.accuracy, 0), 100)}%`;
                    console.log(barWidth)
                    const intensity =
                      cat.accuracy >= 80 && cat.accuracy<=100
                        ? "from-yellow-400 via-cyan-400 to-green-400"
                        : cat.accuracy >= 60
                          ? "from-yellow-300 via-amber-300 to-orange-300"
                          : "from-red-400 via-pink-400 to-purple-400";

                    return (
                      <motion.div
                        key={cat.name}
                        whileHover={{ scale: 1.03, y: -4 }}
                        transition={{ type: "spring", stiffness: 200, damping: 16 }}
                        className="
                          relative overflow-hidden rounded-2xl p-4 
                          bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/50
                          border border-cyan-400/35
                          shadow-[0_0_22px_rgba(0,255,255,0.18)]
                        "
                      >
                        {/* glow accent in corner */}
                        <div
                          className={`
                            pointer-events-none absolute -right-10 -top-10 w-32 h-32 rounded-full 
                            bg-gradient-to-br ${intensity} blur-3xl opacity-60
                          `}
                        />

                        {/* Category name + accuracy pill */}
                        <div className="relative flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/70 mb-1">
                              Category
                            </div>
                            <div className="text-xl font-semibold">
                              {cat.name}
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="text-[11px] uppercase tracking-widest text-cyan-200/70">
                              Accuracy
                            </span>
                            <span className="mt-0.5 inline-flex items-baseline gap-1 px-2.5 py-1 rounded-full text-sm font-semibold bg-black/40 border border-cyan-300/60 shadow-[0_0_12px_rgba(0,255,255,0.35)]">
                              <span className="text-lg">{cat.accuracy}</span>
                              <span className="text-xs">%</span>
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="relative mt-1 mb-3">
                          <div className="h-2.5 w-full rounded-full bg-slate-800/80 overflow-hidden border border-cyan-300/30">
                            <div
                              className={`
                                h-full rounded-full bg-gradient-to-r ${intensity}
                              `}
                              style={{ width: barWidth }}
                            />
                          </div>
                          <div className="mt-1 flex justify-between text-[11px] text-cyan-200/80">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {/* Counters */}
                        <div className="relative flex items-center justify-between mt-2 text-xs sm:text-sm">
                          <div>
                            <div className="text-cyan-200/80 uppercase tracking-widest text-[10px] mb-0.5">
                              Questions
                            </div>
                            <div className="font-semibold">
                              {cat.questionsAnswered}
                              <span className="text-cyan-200/80 text-[11px] ml-1">
                                answered
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-green-200/80 uppercase tracking-widest text-[10px] mb-0.5">
                              Correct
                            </div>
                            <div className="font-semibold text-green-300">
                              {cat.correctAnswers}
                              <span className="text-green-200/80 text-[11px] ml-1">
                                correct
                              </span>
                            </div>
                          </div>
                          <div className="hidden sm:block text-[11px] text-cyan-200/75">
                            ({cat.correctAnswers}/{cat.questionsAnswered})
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="opacity-80 text-sm">
                No categories played yet. Start a quiz to see your performance
                by topic here.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>


    </div>

  );
}