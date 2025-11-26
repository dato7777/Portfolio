import { useState, useEffect, useRef } from "react";

export default function PopulationCounter({ target }) {
  const [value, setValue] = useState(0);

  const animRef = useRef(null);
  const startRef = useRef(null);
  const lastValueRef = useRef(0);

  useEffect(() => {
    if (target == null) return;

    // 🔥 Make sure target is a number
    const num = Number(target);
    if (isNaN(num)) return;

    cancelAnimationFrame(animRef.current);
    startRef.current = null;

    const duration = 5000;

    const animate = (time) => {
      if (!startRef.current) startRef.current = time;

      const elapsed = time - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = Math.floor(eased * num);

      if (current !== lastValueRef.current) {
        lastValueRef.current = current;
        setValue(current);
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [target]);

  return (
    <span className="text-2xl font-bold text-green-300 drop-shadow-[0_0_8px_rgba(0,255,150,0.3)]">
      {value.toLocaleString()}
    </span>
  );
}