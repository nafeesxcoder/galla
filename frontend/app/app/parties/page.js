"use client";

import { Suspense } from "react";
import Shell from "../../../components/app/Shell";
import PartiesPage from "../../../components/app/parties/PartiesPage";
import { PARTIES } from "../../../components/app/content";

export default function Page() {
  return (
    <Shell title={PARTIES.title}>
      {/* The list reads ?filter= from the URL, and Next wants anything using
          the search params to sit inside a Suspense boundary. */}
      <Suspense fallback={null}>
        <PartiesPage />
      </Suspense>
    </Shell>
  );
}
