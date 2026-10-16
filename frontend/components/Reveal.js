"use client";
import { useEffect, useRef, useState } from "react";

// Scroll par fade + slide animation. Kisi bhi section/card ko <Reveal> se wrap kar do.
export default function Reveal({
  children,
  delay = 0,
  y = 24,
  as: Tag = "div",
  className = "",
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return setShown(true);

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? "is-in" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms`, "--reveal-y": `${y}px` }}
    >
      {children}
    </Tag>
  );
}
