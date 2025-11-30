import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const project_list = [
  {
    name: "QuizProAI",
    description:
      "AI-powered quiz game with authentication, stats tracking, and category-based questions.",
    tech: "Python · FastAPI · SQLModel · OpenAI · JWT Auth · React · Framer Motion · Tailwind CSS",
    color: "from-fuchsia-500/30 via-violet-500/20 to-indigo-600/30",
  },
  {
    name: "Weather",
    description:
      "Live global temperature extremes with continent-based city search and animated visuals.",
    tech: "Python · FastAPI · OpenWeather API · React · Framer Motion · Tailwind CSS",
    color: "from-cyan-400/30 via-sky-400/20 to-blue-700/30",
  },
  {
    name: "Smart File Organizer",
    description:
      "Desktop utility that auto-sorts files by type and date and cleans up existing folders.",
    tech: "Python · Tkinter · OS / shutil · Desktop Automation",
    color: "from-amber-400/30 via-orange-500/20 to-emerald-500/25",
  },
];

export default function Projects() {
  const navigate = useNavigate();
  const handleProjectClick = (projectName) => {
    const slug = projectName.toLowerCase().replace(/\s+/g, "");
    navigate(`/projects/${slug}`);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden">
      {/* 🌌 Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0b1120] via-[#0a0f1a] to-black" />
      <motion.div
        className="absolute -inset-40 rounded-[40%] bg-gradient-to-tr from-indigo-500/20 via-fuchsia-400/10 to-cyan-300/10 blur-3xl -z-10"
        animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.05, 0.98, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-6xl font-extrabold mb-4 tracking-wide text-center bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent"
      >
        My Projects
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-base md:text-lg text-neutral-300 mb-10 text-center max-w-xl"
      >
        Explore some of my featured projects — built with modern tech, clean
        design, and smart functionality.
      </motion.p>

      {/* 🪩 Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-6 max-w-4xl w-full">
        {project_list.map((project, idx) => (
          <motion.div
            key={project.name}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.08, duration: 0.25 }}
            whileHover={{ scale: 1.04, y: -8 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleProjectClick(project.name)}
            className="
              relative group cursor-pointer
              rounded-2xl md:rounded-3xl
              border border-white/10
              shadow-[0_18px_40px_rgba(0,0,0,0.55)]
              overflow-hidden
            "
          >
            {/* Gradient background per project */}
            <div
              className={`
                absolute inset-0
                bg-gradient-to-br ${project.color}
              `}
            />

            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-slate-950/60 group-hover:bg-slate-950/40 transition-colors duration-200" />

            {/* Glow hover effect */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.14), transparent 70%)",
              }}
            />

            {/* Content */}
            <div className="relative z-10 p-5 md:p-6 text-left flex flex-col gap-3">
              {/* Small pill label */}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.18em]
                  bg-black/35 border border-white/15 text-slate-100/80 uppercase">
                Project
              </span>

              {/* Project name */}
              <h2 className="text-xl md:text-2xl font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_0_16px_rgba(15,23,42,0.9)]">
                {project.name}
              </h2>

              {/* Description */}
              <p className="text-sm md:text-[15px] leading-relaxed text-slate-100/85">
                {project.description}
              </p>

              {/* Tech stack as colorful chips */}
              <div className="mt-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200/70 mb-1.5">
                  Tech
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.split("·").map((item, techIdx) => (
                    <span
                      key={techIdx}
                      className="
                        px-2.5 py-1 rounded-full 
                        text-[10px] md:text-[11px] font-medium
                        bg-black/40 border border-white/10
                        text-slate-100/90 shadow-[0_0_10px_rgba(15,23,42,0.7)]
                      "
                    >
                      {item.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom accent line */}
            <motion.div
              className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-indigo-500 opacity-70"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        ))}
      </div>

      {/* Footer Glow */}
      <motion.div
        className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-indigo-900/20 to-transparent blur-3xl"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}