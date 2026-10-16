"use client";

import { useParams } from "next/navigation";
import Shell from "../../../../components/app/Shell";
import BillDetail from "../../../../components/app/bills/BillDetail";
import { BILLS } from "../../../../components/app/content";

export default function Page() {
  const { id } = useParams();

  return (
    <Shell title={BILLS.title}>
      <BillDetail id={id} />
    </Shell>
  );
}
