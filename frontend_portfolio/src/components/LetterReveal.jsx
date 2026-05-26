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

/** Split text into words, spaces, and explicit newlines for responsive wrapping. */
function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\n") {
      tokens.push({ type: "newline", key: `nl-${i}` });
      i += 1;
    } else if (ch === " ") {
      tokens.push({ type: "space", key: `sp-${i}` });
      i += 1;
    } else {
      let word = "";
      const start = i;
      while (i < text.length && text[i] !== " " && text[i] !== "\n") {
        word += text[i];
        i += 1;
      }
      tokens.push({ type: "word", key: `w-${start}`, value: word });
    }
  }
  return tokens;
}

function RevealTokens({ tokens, animated = true }) {
  return tokens.map((token) => {
    if (token.type === "newline") {
      return <br key={token.key} />;
    }
    if (token.type === "space") {
      return (
        <span key={token.key} className="inline">
          {" "}
        </span>
      );
    }
    return (
      <span key={token.key} className="inline">
        {Array.from(token.value).map((ch, j) =>
          animated ? (
            <motion.span key={j} variants={letterVariants} className="inline">
              {ch}
            </motion.span>
          ) : (
            <span key={j} className="inline">
              {ch}
            </span>
          )
        )}
      </span>
    );
  });
}

/**
 * Typewriter-style reveal. Uses normal spaces (not nbsp) so text wraps on narrow screens.
 * Pair with LetterRevealPlaceholder in a relative wrapper to reserve height.
 */
export default function LetterReveal({ text, onComplete, className = "" }) {
  const tokens = tokenize(text);
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
      className={`block w-full break-words [overflow-wrap:anywhere] ${className}`}
      aria-live="polite"
    >
      <RevealTokens tokens={tokens} animated />
    </motion.span>
  );
}

/** Invisible copy — keeps layout height stable while LetterReveal runs. */
export function LetterRevealPlaceholder({ text, className = "" }) {
  const tokens = tokenize(text);
  return (
    <span
      aria-hidden
      className={`invisible select-none pointer-events-none block w-full break-words [overflow-wrap:anywhere] ${className}`}
    >
      <RevealTokens tokens={tokens} animated={false} />
    </span>
  );
}
