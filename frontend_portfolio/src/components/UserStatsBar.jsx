// src/components/UserStatsBar.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

    // go back to login page
    navigate("/login");
  };

  const accuracy =
    stats && stats.questionsAnswered
      ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
      : 0;

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

        {open === "categories" && (
          <motion.div
            key="categories-panel"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="
              mt-3 rounded-2xl p-5 
              bg-black/40 border border-cyan-300/40 
              shadow-[0_0_18px_rgba(0,255,255,0.18)]
              backdrop-blur
              text-sm text-cyan-50
            "
          >
            {stats?.categories && stats.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="
                      px-3 py-1 rounded-full 
                      bg-cyan-900/40 border border-cyan-400/60
                      text-xs font-semibold tracking-wide
                      shadow-[0_0_10px_rgba(0,255,255,0.2)]
                    "
                  >
                    {cat}
                  </span>
                ))}
              </div>
            ) : (
              <div className="opacity-70">
                No categories played yet. Start a quiz to see history here.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}