"use client";
import { useState } from "react";

const steps = [
  {
    time: "08:00 AM",
    tag: "On the move",
    t: "Start anywhere",
    d: "Check stock from your phone on the way to the shop. By the time you open the shutter, your billing is already in sync.",
    chip: "Multi-device control",
  },
  {
    time: "11:00 AM",
    tag: "Busy hours",
    t: "Staff logins",
    d: "Your salesmen bill from their own logins. You decide what each person can see and change.",
    chip: "Role-based access",
  },
  {
    time: "04:00 PM",
    tag: "Net down",
    t: "Works without internet",
    d: "The connection drops but the queue keeps moving. Everything syncs the moment you are back online.",
    chip: "Always-on billing",
  },
  {
    time: "09:00 PM",
    tag: "Closing time",
    t: "Backed up and safe",
    d: "As you close for the day, the day's data is already backed up to your cloud drive.",
    chip: "Automatic backup",
  },
];

export default function DayJourney() {
  const [active, setActive] = useState(0);
  const s = steps[active];

  return (
    <section className="section">
      <div className="wrap">
        <span className="eyebrow">A day in your shop</span>
        <h2>From the first bill to closing the shutter</h2>

        <div className="journey">
          <ol className="journey__list">
            {steps.map((step, i) => (
              <li key={step.t}>
                <button
                  type="button"
                  className={i === active ? "active" : ""}
                  aria-current={i === active ? "step" : undefined}
                  onClick={() => setActive(i)}
                >
                  <span className="journey__num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <b>{step.t}</b>
                    <small>
                      {step.time} · {step.tag}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <div className="journey__panel">
            <span className="journey__time">
              {s.time} · {s.tag}
            </span>
            <h3>{s.t}</h3>
            <p>{s.d}</p>
            <span className="journey__chip">{s.chip}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
