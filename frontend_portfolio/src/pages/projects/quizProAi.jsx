import React, { useState, useEffect, useRef } from "react";
import { Button } from "@material-tailwind/react";
import { motion } from "framer-motion";
import api from "../../api/client";
import UserStatsBar from "../../components/UserStatsBar";

const categories = ["Geography", "Science", "History", "Technology", "Literature"];
const letters = ["A", "B", "C", "D"];

const LANGUAGES = [
  { name: "English", flag: "🇬🇧" },
  { name: "Russian", flag: "🇷🇺" },
  { name: "Georgian", flag: "🇬🇪" },
];

export default function QuizProAI() {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fadeOutOthers, setFadeOutOthers] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [language, setLanguage] = useState("English");
  const [customCategory, setCustomCategory] = useState("");
  const [catError, setCatError] = useState("");
  const [progress, setProgress] = useState(0);

  const lastEventTimeRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // 🔢 STATS FOR USER – backend is the source of truth, we just mirror it
  const [stats, setStats] = useState({
    questionsAnswered: 0,
    correctAnswers: 0,
    totalTimeSeconds: 0,
    streak: 0,
    bestStreak: 0,
    categories: [],
    avgTimePerQuestion: 0,
    perCategory: [],
  });

  // ======== Reset quiz when finished ========
  useEffect(() => {
    if (questions.length > 0 && Object.keys(selectedOptions).length === questions.length) {
      setTimeout(() => resetQuiz(), 2500);
    }
  }, [selectedOptions, questions]);

  // Load stats when component mounts
  useEffect(() => {
    getStatsFromBackend();
  }, []);

  const resetQuiz = () => {
    setQuestions([]);
    setSelectedOptions({});
    setSelectedCategory(null);
    setFadeOutOthers(false);
    setCustomCategory("");
    setCatError("");
    setProgress(0);
    setLoading(false);
  };

  // ======== Animate progress bar ========
  useEffect(() => {
    if (loading) {
      setProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => (prev < 95 ? prev + 1 : prev)); // cap at 95 while waiting
      }, 40);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress(100);
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [loading]);

  // ======== Backend sync helper: send ONE event (one answered question) ========
  async function syncStatsWithBackend({ correct, timeSpent, category }) {
    try {
      await api.post("/quiz/stats/event", {
        correct,
        time_spent: timeSpent,
        category,
      });
      // console.log("Sent event for category:", category);
    } catch (err) {
      console.error("Failed to sync stats:", err);
    }
  }

  async function getStatsFromBackend() {
    try {
      const res = await api.get("/quiz/stats/me");
      // Backend returns QuizStatsOut: we spread it into our local state
      setStats((prev) => ({
        ...prev,
        ...res.data,
        // totalTimeSeconds is not part of QuizStatsOut, keep local value if you want
        totalTimeSeconds: prev.totalTimeSeconds,
      }));
    } catch (err) {
      console.error("Failed to get stats from backend:", err);
    }
  }

  // ======== Questions fetch ========
  const fetchQuestions = async (category, lang) => {
    setLoading(true);
    setProgress(0);
    try {
      const res = await api.post(
        "/quizproai/generate-questions/",
        { category, language: lang },
        { headers: { "Content-Type": "application/json" } }
      );

      setProgress(100);

      setTimeout(() => {
        const data = JSON.parse(res.data);
        setQuestions(data);
        lastEventTimeRef.current = Date.now();
        setLoading(false);
      }, 150);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Could not prepare questions. Try again later.";
      alert(msg);
      resetQuiz();
    }
  };

  const handleCategoryClick = (category) => {
    if (loading) return;
    const langAtClick = language;
    setSelectedCategory(category);
    setCatError("");
    setFadeOutOthers(true);
    setTimeout(() => fetchQuestions(category, langAtClick), 600);
  };

  const startCustom = () => {
    const cat = customCategory.trim();
    if (!cat) return setCatError("Please enter a category.");
    if (cat.length < 3 || cat.length > 40)
      return setCatError("Category should be 3–40 characters.");
    handleCategoryClick(cat);
  };

  const cancelQuiz = () => resetQuiz();

  const InfoCard = ({ children }) => (
    <div className="mx-auto max-w-3xl mt-6 text-left bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-[0_0_25px_rgba(0,255,255,0.15)] border border-white/20 z-20">
      {children}
    </div>
  );

  // ======== Handle answer click (update stats + send event) ========
  const handleOptionClick = (qIndex, option, question) => {
    const alreadySelected = selectedOptions[qIndex];
    if (alreadySelected) return;

    const now = Date.now();
    const timeSpentSeconds = lastEventTimeRef.current
      ? (now - lastEventTimeRef.current) / 1000
      : 0;
    lastEventTimeRef.current = now;

    const isCorrect = option === question.answer;
    const categoryName = selectedCategory || customCategory || "Unknown";

    // mark answer locally
    setSelectedOptions((prev) => ({ ...prev, [qIndex]: option }));

    // Optimistic global stats (per-category comes from backend)
    setStats((prev) => {
      const questionsAnswered = prev.questionsAnswered + 1;
      const correctAnswers = prev.correctAnswers + (isCorrect ? 1 : 0);
      const streak = isCorrect ? prev.streak + 1 : 0;
      const bestStreak = Math.max(prev.bestStreak, streak);
      const totalTimeSeconds = prev.totalTimeSeconds + timeSpentSeconds;
      const avgTimePerQuestion =
        questionsAnswered > 0 ? totalTimeSeconds / questionsAnswered : 0;

      const categories =
        prev.categories.includes(categoryName)
          ? prev.categories
          : [...prev.categories, categoryName];

      return {
        ...prev,
        questionsAnswered,
        correctAnswers,
        streak,
        bestStreak,
        totalTimeSeconds,
        avgTimePerQuestion,
        categories,
        // perCategory is updated from backend only
      };
    });

    // send single event to backend, then refresh stats from DB
    syncStatsWithBackend({
      correct: isCorrect,
      timeSpent: timeSpentSeconds,
      category: categoryName,
    })
      .then(() => getStatsFromBackend())
      .catch((err) => console.error("sync or refresh failed:", err));
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white flex flex-col items-center justify-start px-6 pb-32 pt-24">
      {/* ✨ Background */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-[#010516] via-[#13002b] to-[#000814]"
        style={{ pointerEvents: "none" }}
      />

      {/* 👤 User + stats bar */}
      <UserStatsBar stats={stats} />

      <motion.div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,255,0.08),transparent_70%)]"
        style={{ pointerEvents: "none" }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_80%,rgba(255,200,0,0.08),transparent_70%)]"
        style={{ pointerEvents: "none" }}
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 220, repeat: Infinity, ease: "linear" }}
      />

      {/* 🧠 Title */}
      <motion.h1
        className="z-20 text-5xl md:text-6xl font-extrabold text-center mb-10 tracking-wide drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        ⚡ QuizProAI
      </motion.h1>

      {/* 🌍 Language Selector */}
      {!fadeOutOthers && !questions.length && (
        <motion.div
          className="z-20 flex justify-center items-center gap-4 mb-10 backdrop-blur-md bg-white/10 px-6 py-3 rounded-full border border-cyan-400/30 shadow-[0_0_20px_rgba(0,255,255,0.15)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {LANGUAGES.map((lang) => (
            <motion.button
              key={lang.name}
              onClick={() => setLanguage(lang.name)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 text-lg font-semibold px-4 py-2 rounded-full transition-all ${
                language === lang.name
                  ? "bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,255,255,0.6)]"
                  : "bg-transparent text-cyan-100 hover:bg-cyan-600/20 border border-cyan-300/30"
              }`}
            >
              <span className="text-2xl">{lang.flag}</span> {lang.name}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* 💬 Info Section */}
      {!selectedCategory && !questions.length && (
        <InfoCard>
          <p className="font-semibold text-lg mb-3">How it works</p>
          <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
            <li>Pick a category (or enter your own).</li>
            <li>Server returns 5 unused questions from the DB.</li>
            <li>If empty, it generates 10 new ones using OpenAI and stores them.</li>
            <li>Answers are the actual text options, not letters.</li>
          </ul>
          <button
            onClick={() => setShowHow((v) => !v)}
            className="mt-3 text-xs underline underline-offset-2 text-cyan-200 hover:text-white"
          >
            {showHow ? "Hide prompt example" : "Show prompt example"}
          </button>
          {showHow && (
            <pre className="mt-3 text-xs bg-black/30 p-3 rounded-lg overflow-x-auto text-indigo-100">
{`Return ONLY JSON array of 10 items.
Each item:
{
  "level": 1,
  "question": "short and clear",
  "options": ["1", "2", "3", "4"],
  "answer": "1"
}`}
            </pre>
          )}
        </InfoCard>
      )}

      {/* 🎯 Preset Categories */}
      {!fadeOutOthers && !questions.length && (
        <div className="z-20 flex flex-wrap justify-center gap-4 mt-10">
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => handleCategoryClick(category)}
              disabled={loading}
              className="text-lg rounded-full px-6 py-3 bg-cyan-700/20 border border-cyan-400/40 text-white hover:bg-cyan-500/40 transition disabled:opacity-50"
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* 📝 Custom Category Input */}
      {!fadeOutOthers && !questions.length && (
        <motion.div
          className="z-20 max-w-2xl w-full text-center mt-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <p className="text-2xl font-semibold text-white mb-6 drop-shadow-lg">
            OR <span className="text-yellow-300">enter your own</span> category:
          </p>
          <div className="relative group flex justify-center">
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Type your custom topic..."
              className="w-full max-w-lg text-2xl text-center font-bold text-indigo-100 placeholder-indigo-300 
                         bg-white/10 border-2 border-cyan-400/40 rounded-full px-6 py-4 
                         focus:outline-none focus:ring-4 focus:ring-yellow-300/40 
                         focus:border-yellow-300 shadow-md transition-all duration-300"
            />
          </div>
          <Button
            onClick={startCustom}
            disabled={loading}
            className="mt-6 text-indigo-800 text-xl font-semibold rounded-full px-10 py-4 
                       bg-yellow-300 hover:bg-yellow-400 hover:shadow-[0_0_25px_rgba(255,255,0,0.6)] hover:scale-105 transition-all duration-300 disabled:opacity-60"
          >
            Start
          </Button>
          {catError && (
            <p className="text-red-300 text-sm mt-3 font-semibold animate-pulse">
              {catError}
            </p>
          )}
        </motion.div>
      )}

      {/* ⏳ Loading Bar */}
      {loading && (
        <div className="z-20 mt-12 text-xl text-cyan-200 w-full max-w-lg">
          <p>Loading questions...</p>
          <div className="relative bg-gray-700/30 rounded-full h-6 mt-4 overflow-hidden border border-cyan-300/40">
            <div
              className="bg-gradient-to-r from-yellow-400 via-cyan-300 to-yellow-400 h-6 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm mt-1">{progress}%</p>
        </div>
      )}

      {/* 🧩 Questions Section */}
      {questions.length > 0 && (
        <motion.div
          className="z-20 w-full max-w-3xl mt-10 space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {questions.map((q, idx) => {
            const selectedOption = selectedOptions[idx];
            const isCorrect = selectedOption === q.answer;

            return (
              <div
                key={idx}
                className="text-left bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.1)]"
              >
                <p className="text-lg font-bold mb-2 text-yellow-200">
                  Level {q.level}: <span className="text-white">{q.question}</span>
                </p>
                {selectedOption && (
                  <p
                    className={`mb-2 font-semibold ${
                      isCorrect ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isCorrect ? "✅ Correct!" : "❌ Wrong answer"}
                  </p>
                )}
                <ul className="space-y-2">
                  {q.options.map((option, i) => (
                    <li
                      key={i}
                      onClick={() => handleOptionClick(idx, option, q)}
                      className={`rounded px-3 py-2 cursor-pointer transition text-lg ${
                        selectedOption
                          ? option === q.answer
                            ? "bg-green-600/60 border border-green-300/40"
                            : option === selectedOption
                            ? "bg-red-600/60 border border-red-300/40"
                            : "bg-cyan-800/40"
                          : "bg-cyan-900/40 hover:bg-cyan-700/60 border border-cyan-400/30"
                      }`}
                    >
                      <strong className="mr-2 text-cyan-300">{letters[i]}.</strong> {option}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* ❌ Cancel Quiz Button */}
          <div className="flex justify-center mt-10">
            <Button
              onClick={cancelQuiz}
              className="text-white font-semibold text-lg rounded-full px-8 py-3 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-all duration-300"
            >
              ✖ Cancel Quiz
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}