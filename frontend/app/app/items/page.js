"use client";

import Shell from "../../../components/app/Shell";
import ItemsPage from "../../../components/app/items/ItemsPage";
import { ITEMS } from "../../../components/app/content";

export default function Page() {
  return (
    <Shell title={ITEMS.title}>
      <ItemsPage />
    </Shell>
  );
}
