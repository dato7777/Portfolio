// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(""); // used only for signup
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // where to go after login
  const from = location.state?.from?.pathname || "/projects/quizProAi";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password || (mode === "signup" && !email)) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (mode === "login") {
        res = await api.post("/auth/login", { username, password });
      } else {
        res = await api.post("/auth/signup", { username, email, password });
      }

      const token = res.data.access_token;
      login({ token, username });
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Could not " + (mode === "login" ? "log in" : "sign up") + ".";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center text-white overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#040a20] to-black" />
      <motion.div
        className="absolute -top-40 -left-40 w-[140vw] h-[140vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(30,150,255,0.16)_0%,transparent_70%)]"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
      />

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-md px-8 py-10 rounded-3xl bg-white/10 border border-cyan-400/30 backdrop-blur-xl shadow-[0_0_40px_rgba(0,255,255,0.25)]"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-extrabold text-center mb-2 tracking-wide">
          QuizProAI Access
        </h1>
        <p className="text-center text-sm text-cyan-100/80 mb-6">
          {mode === "login" ? "Log in to your quiz profile." : "Create a new account to start playing."}
        </p>

        {/* Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-full bg-black/40 border border-cyan-400/40 p-1">
            <button
              onClick={() => setMode("login")}
              className={
                "px-4 py-1 text-xs font-semibold rounded-full transition " +
                (mode === "login"
                  ? "bg-cyan-400 text-black shadow-[0_0_12px_rgba(0,255,255,0.7)]"
                  : "text-cyan-100/70")
              }
            >
              Login
            </button>
            <button
              onClick={() => setMode("signup")}
              className={
                "px-4 py-1 text-xs font-semibold rounded-full transition " +
                (mode === "signup"
                  ? "bg-yellow-300 text-black shadow-[0_0_12px_rgba(255,255,0,0.7)]"
                  : "text-cyan-100/70")
              }
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-red-500/15 border border-red-400/40 text-xs text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-cyan-400/40 px-3 py-2 text-sm text-cyan-50
                         focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              placeholder="your_nickname"
            />
          </div>

          {/* Email for signup */}
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-cyan-400/40 px-3 py-2 text-sm text-cyan-50
                           focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                placeholder="you@example.com"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-cyan-400/40 px-3 py-2 text-sm text-cyan-50
                         focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              placeholder="••••••••"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            className="w-full mt-2 py-2.5 rounded-full font-semibold text-black
                       bg-gradient-to-r from-cyan-400 to-yellow-300
                       shadow-[0_0_20px_rgba(0,255,255,0.5)]
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
              ? "Log in"
              : "Sign up"}
          </motion.button>
        </form>

        <p className="mt-4 text-[11px] text-center text-cyan-100/60">
          After successful {mode === "login" ? "login" : "signup"}, you’ll be redirected
          straight to QuizProAI.
        </p>
      </motion.div>
    </div>
  );
}