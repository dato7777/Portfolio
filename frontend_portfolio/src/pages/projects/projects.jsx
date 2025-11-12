import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const project_list = [
  {
    name: "QuizProAI",
    description: "AI-powered quiz game with FastAPI backend & React frontend.",
    color: "from-fuchsia-500/30 via-purple-500/20 to-indigo-600/30",
  },
  {
    name: "Weather",
    description: "Live global temperature extremes visualization by continent.",
    color: "from-cyan-400/30 via-blue-500/20 to-indigo-700/30",
  },
];

export default function Projects() {
  const navigate = useNavigate();

  const handleProjectClick = (project) => {
    navigate(`/projects/${project.toLowerCase()}`);
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
        className="text-lg md:text-xl text-neutral-300 mb-12 text-center max-w-xl"
      >
        Explore some of my featured projects — built with modern tech, clean
        design, and smart functionality.
      </motion.p>

      {/* 🪩 Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 max-w-5xl w-full">
        {project_list.map((project, idx) => (
          <motion.div
            key={project.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.1, duration: 0.1 }}
            whileHover={{ scale: 1.07, y: -15 }}
            whileTap={{ scale: 0.97 }}
            className={`relative backdrop-blur-md border border-white/10 shadow-xl rounded-3xl overflow-hidden cursor-pointer 
              bg-gradient-to-br ${project.color} 
              transition-transform duration-150 ease-out`}
            onClick={() => handleProjectClick(project.name)}
          >
            {/* Glow hover effect (snappier) */}
            <motion.div
              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-150 ease-out"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12), transparent 70%)",
              }}
            />

            <div className="p-8 text-center z-10 relative">
              <h2 className="text-3xl font-bold mb-2">{project.name}</h2>
              <p className="text-neutral-300 text-sm md:text-base leading-relaxed">
                {project.description}
              </p>
            </div>

            <motion.div
              className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-indigo-500"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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

