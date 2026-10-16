"use client";

import { useParams } from "next/navigation";
import Shell from "../../../../components/app/Shell";
import PartyDetail from "../../../../components/app/parties/PartyDetail";
import { PARTIES } from "../../../../components/app/content";

export default function Page() {
  // useParams rather than the page's own params prop: that prop is a promise
  // in current Next, and this way the component stays plain.
  const { id } = useParams();

  return (
    <Shell title={PARTIES.title}>
      <PartyDetail id={id} />
    </Shell>
  );
}
