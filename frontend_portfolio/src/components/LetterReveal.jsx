// src/components/LetterReveal.jsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const lineVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.018,
      delayChildren: 0.12,
    },
  },
};

const letterVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.04, ease: "easeOut" } },
};

/**
 * Typewriter-style reveal. Pair with an invisible duplicate of `text` in a
 * relative wrapper so height is reserved and the page never jumps while typing.
 */
export default function LetterReveal({ text, onComplete, className = "" }) {
  const chars = Array.from(text);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
  }, [text]);

  const handleComplete = () => {
    if (completedRef.current || !onComplete) return;
    completedRef.current = true;
    onComplete();
  };

  return (
    <motion.span
      variants={lineVariants}
      initial="hidden"
      animate="visible"
      onAnimationComplete={handleComplete}
      className={`inline ${className}`}
      aria-live="polite"
    >
      {chars.map((ch, i) => {
        if (ch === "\n") return <br key={`br-${i}`} />;
        return (
          <motion.span key={i} variants={letterVariants} className="inline">
            {ch === " " ? "\u00A0" : ch}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

/** Invisible copy — keeps layout height stable while LetterReveal runs. */
export function LetterRevealPlaceholder({ text, className = "" }) {
  const chars = Array.from(text);
  return (
    <span
      aria-hidden
      className={`invisible select-none pointer-events-none block ${className}`}
    >
      {chars.map((ch, i) => {
        if (ch === "\n") return <br key={`br-${i}`} />;
        return (
          <span key={i} className="inline">
            {ch === " " ? "\u00A0" : ch}
          </span>
        );
      })}
    </span>
  );
}
