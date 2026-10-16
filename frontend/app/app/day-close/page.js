"use client";

import Shell from "../../../components/app/Shell";
import DayClose from "../../../components/app/dayclose/DayClose";
import { DAYCLOSE } from "../../../components/app/content";

export default function Page() {
  return (
    <Shell title={DAYCLOSE.title}>
      <DayClose />
    </Shell>
  );
}
