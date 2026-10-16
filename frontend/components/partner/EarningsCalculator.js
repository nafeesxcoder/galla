// ===========================================================================
// SECTION 8  -  "Calculate What You Could Earn"
// ---------------------------------------------------------------------------
// Moving the slider animates the numbers up instead of jumping.
// The rate lives in content.js -> calc.perClientPerMonth (placeholder for now).
// IMAGE: none
// ===========================================================================

"use client";
import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/Reveal";

// Eases the number to its new value instead of jumping straight there
function useCountUp(target, ms = 420) {
  const [n, setN] = useState(target);
  const from = useRef(target);
  const raf = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const b = target;

    function tick(now) {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(a + (b - a) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else from.current = b;
    }

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, ms]);

  return n;
}

const inr = (v) => "₹" + v.toLocaleString("en-IN");

export default function EarningsCalculator({ calc }) {
  const [clients, setClients] = useState(calc.start);

  const monthly = clients * calc.perClientPerMonth;
  const annual = monthly * 12;

  const mShown = useCountUp(monthly);
  const aShown = useCountUp(annual);

  const pct = ((clients - calc.min) / (calc.max - calc.min)) * 100;

  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{calc.eyebrow}</span>
          <h2>{calc.h2}</h2>
          <p className="lead">{calc.lead}</p>
        </Reveal>

        <div className="pt-calc">
          <Reveal className="pt-calc__box">
            <h3>{calc.title}</h3>
            <p className="pt-calc__sub">{calc.sub}</p>

            <label className="pt-calc__label" htmlFor="pt-clients">
              {calc.label}
              <strong>{clients}</strong>
            </label>

            <input
              id="pt-clients"
              type="range"
              min={calc.min}
              max={calc.max}
              value={clients}
              onChange={(e) => setClients(Number(e.target.value))}
              className="pt-range"
              style={{ "--pt-pct": `${pct}%` }}
            />
            <div className="pt-calc__ends">
              <span>{calc.min}</span>
              <span>{calc.max}</span>
            </div>

            <div className="pt-calc__out">
              <div>
                <span>{calc.monthlyLabel}</span>
                <strong>{inr(mShown)}</strong>
              </div>
              <div>
                <span>{calc.annualLabel}</span>
                <strong>{inr(aShown)}</strong>
              </div>
            </div>

            <p className="pt-calc__note">{calc.note}</p>
          </Reveal>

          <Reveal className="pt-get" delay={140}>
            <h3>{calc.getTitle}</h3>
            <ul>
              {calc.get.map((g, i) => (
                <li key={g} style={{ animationDelay: `${i * 80}ms` }}>
                  <span aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {g}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
