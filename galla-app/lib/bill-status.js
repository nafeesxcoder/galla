// How a bill is described in a list. Kept out of the screens because the
// list and the detail must never disagree about whether something is paid.

export const DOC_LABEL = {
  sale: "Sale",
  purchase: "Purchase",
  estimate: "Estimate",
  credit_note: "Sales return",
  debit_note: "Purchase return",
};

// Paid, part paid, nothing paid, cancelled. The colour carries the meaning in
// a long list; the word is there for anybody who cannot tell the colours
// apart.
export function billTone(b) {
  if (!b) return { tone: "info", label: "" };
  if (b.status === "cancelled" || b.cancelledAt) return { tone: "cancelled", label: "Cancelled" };
  if (b.docType === "estimate") return { tone: "draft", label: "Estimate" };
  if (b.amounts.balance <= 0) return { tone: "paid", label: "Paid" };
  if (b.amounts.paid > 0) return { tone: "partial", label: "Part paid" };
  return { tone: "unpaid", label: "Unpaid" };
}
