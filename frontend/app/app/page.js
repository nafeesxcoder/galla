"use client";

import Shell from "../../components/app/Shell";
import Dashboard from "../../components/app/Dashboard";
import { HOME } from "../../components/app/content";

export default function AppHomePage() {
  return (
    <Shell title={HOME.title}>
      <Dashboard />
    </Shell>
  );
}
