"use client";

import { useState } from "react";
import Shell from "../../../components/app/Shell";
import ReportsPage from "../../../components/app/reports/ReportsPage";
import GstReturns from "../../../components/app/reports/GstReturns";
import { REPORTS, GSTR } from "../../../components/app/content";

export default function Page() {
  // Two different jobs under one heading. The summary is for the shopkeeper,
  // looked at daily; the returns are for the accountant, once a month. They
  // share nothing but the data, so they are tabs rather than one long page.
  const [tab, setTab] = useState("summary");

  return (
    <Shell title={REPORTS.title}>
      <div className="ap-seg" style={{ marginBottom: 16 }}>
        <button type="button" aria-pressed={tab === "summary"} onClick={() => setTab("summary")}>
          {GSTR.tabSummary}
        </button>
        <button type="button" aria-pressed={tab === "returns"} onClick={() => setTab("returns")}>
          {GSTR.tabReturns}
        </button>
      </div>

      {tab === "summary" ? <ReportsPage /> : <GstReturns />}
    </Shell>
  );
}
