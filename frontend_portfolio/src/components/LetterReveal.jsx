// src/components/LetterReveal.jsx
import React from "react";
import { motion } from "framer-motion";

const lineVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.15,
    },
  },
};

const letterVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.06, ease: "easeOut" } },
};

export default function LetterReveal({ text, onComplete }) {
  const chars = Array.from(text);

  return (
    <motion.span
      variants={lineVariants}
      initial="hidden"
      animate="visible"
      // 👇 fire when all children (letters) finish animating
      onAnimationComplete={() => onComplete && onComplete()}
      className="inline-block"
    >
      {chars.map((ch, i) => {
        if (ch === "\n") return <br key={`br-${i}`} />;
        return (
          <motion.span key={i} variants={letterVariants} className="inline-block">
            {ch === " " ? "\u00A0" : ch}
          </motion.span>
        );
      })}
    </motion.span>
  );
}
