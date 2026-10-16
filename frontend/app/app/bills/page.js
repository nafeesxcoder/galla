"use client";

import Shell from "../../../components/app/Shell";
import BillsPage from "../../../components/app/bills/BillsPage";
import { BILLS } from "../../../components/app/content";

export default function Page() {
  return (
    <Shell title={BILLS.title}>
      <BillsPage />
    </Shell>
  );
}
