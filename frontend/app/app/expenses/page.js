"use client";

import Shell from "../../../components/app/Shell";
import ExpensesPage from "../../../components/app/expenses/ExpensesPage";
import { EXPENSES } from "../../../components/app/content";

export default function Page() {
  return (
    <Shell title={EXPENSES.title}>
      <ExpensesPage />
    </Shell>
  );
}
