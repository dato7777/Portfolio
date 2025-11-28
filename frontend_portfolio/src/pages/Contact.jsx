// src/pages/Contact.jsx
import { motion } from "framer-motion";
import { Button } from "@material-tailwind/react";

const CONTACT_LINKS = [
  {
    label: "GitHub",
    handle: "@dato7777",
    url: "https://github.com/dato7777",
    icon: "🐙",
    color: "from-slate-800 via-slate-900 to-black",
    accent: "border-slate-400/60",
    tag: "Code · Projects",
  },
  {
    label: "LinkedIn",
    handle: "David J. Gorelashvili",
    url: "https://www.linkedin.com/in/david-j-gorelashvili-696aa9109/",
    icon: "💼",
    color: "from-sky-700 via-sky-900 to-black",
    accent: "border-sky-400/60",
    tag: "Networking · Career",
  },
  {
    label: "Facebook",
    handle: "David J. Gorelashvili (Dato)",
    url: "https://www.facebook.com/dato.gorelashvili/",
    icon: "📘",
    color: "from-blue-700 via-blue-900 to-black",
    accent: "border-blue-400/60",
    tag: "Social · Personal",
  },
  {
    label: "WhatsApp",
    handle: "+972-xx-xxx-xxxx",
    url: "https://wa.me/972509287147", // change to your number, no dashes
    icon: "💬",
    color: "from-emerald-700 via-emerald-900 to-black",
    accent: "border-emerald-400/60",
    tag: "Chat · Quick replies",
  },
];

const EMAIL = "david613jacob@gmail.com"; // <-- put your real email
const COUNTRY = "Israel";        // optional, just for vibe

export default function Contact() {
  return (
    <div className="relative min-h-screen text-white flex flex-col items-center justify-start pt-24 pb-32 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#020618] via-[#050015] to-black" />
      <motion.div
        className="absolute -top-40 -left-32 w-[140vw] h-[140vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),transparent_65%)] -z-10"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 220, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-32 w-[140vw] h-[140vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.12),transparent_70%)] -z-10"
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 260, repeat: Infinity, ease: "linear" }}
      />

      {/* Title */}
      <motion.h1
        className="text-4xl md:text-6xl font-extrabold tracking-wide text-center drop-shadow-[0_0_25px_rgba(0,255,255,0.4)]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
      >
        📡 Contact & Connect
      </motion.h1>

      <motion.p
        className="mt-4 max-w-2xl text-center text-sm md:text-base text-cyan-100/80"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.1 }}
      >
        Want to talk about Python backends, APIs, or crazy portfolio ideas?  
        Choose any channel below and ping me — I usually reply fast.
      </motion.p>

      {/* Main grid of contact cards */}
      <motion.div
        className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.15 }}
      >
        {CONTACT_LINKS.map((item, idx) => (
          <motion.div
            key={item.label}
            className={`
              relative overflow-hidden rounded-2xl 
              border ${item.accent}
              bg-gradient-to-br ${item.color}
              shadow-[0_0_30px_rgba(0,0,0,0.7)]
              backdrop-blur
            `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * idx }}
            whileHover={{ y: -4, scale: 1.01 }}
          >
            {/* Glow overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.14),transparent_55%)] opacity-80" />

            <div className="relative p-5 flex items-center gap-4 md:gap-5">
              {/* Icon bubble */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black/40 border border-white/30 text-2xl">
                <span>{item.icon}</span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg md:text-xl font-semibold truncate">
                    {item.label}
                  </h2>
                  <span className="text-[11px] uppercase tracking-widest text-white/65 bg-black/40 px-2 py-0.5 rounded-full">
                    {item.tag}
                  </span>
                </div>
                <p className="text-sm text-white/80 mt-1 truncate">
                  {item.handle}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                    className="normal-case text-xs font-semibold rounded-full px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_18px_rgba(34,211,238,0.6)]"
                  >
                    Open profile
                  </Button>
                  <Button
                    size="sm"
                    variant="outlined"
                    onClick={() => navigator.clipboard?.writeText(item.url)}
                    className="normal-case text-[11px] font-semibold rounded-full px-3 py-1.5 border-cyan-300/70 text-cyan-100 hover:bg-cyan-500/10"
                  >
                    Copy link
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Email + small contact form */}
      <motion.div
        className="mt-12 w-full max-w-2xl rounded-3xl bg-white/5 border border-cyan-400/40 backdrop-blur-lg p-6 md:p-7 shadow-[0_0_28px_rgba(0,255,255,0.25)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80 mb-1">
              Direct Email
            </p>
            <p className="text-lg md:text-xl font-semibold text-cyan-50">
              <a
                href={`mailto:${EMAIL}`}
                className="underline decoration-cyan-400/70 underline-offset-4 hover:text-cyan-200"
              >
                {EMAIL}
              </a>
            </p>
            <p className="text-xs text-cyan-100/70 mt-1">
              Based in {COUNTRY}, happy to work remotely worldwide 🌍
            </p>
          </div>

          <Button
            onClick={() => {
              const subject = encodeURIComponent("Contact from your portfolio website");
              const body = encodeURIComponent("Hi, I just saw your portfolio and...");
              window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
            }}
            className="self-start md:self-auto normal-case font-semibold rounded-full px-5 py-2 bg-yellow-300 text-black hover:bg-yellow-400 shadow-[0_0_22px_rgba(250,204,21,0.9)]"
          >
            ✉ Write a quick email
          </Button>
        </div>
      </motion.div>
    </div>
  );
}