// ===========================================================================
// PRINTING, PDFs AND WHATSAPP
// ---------------------------------------------------------------------------
// Three different things a shopkeeper means by "send the bill":
//
//   print   the counter printer, or the system print dialog on a desktop
//   pdf     a file, which is what goes into a WhatsApp chat or an email
//   text    a quick message with the number and the amount, no attachment
//
// The WhatsApp one is worth being honest about. wa.me opens a chat with the
// message already typed and the shopkeeper presses send - no API, no fees,
// no approval from Meta. What it cannot do is attach the PDF, because a web
// link has no way to put a file into a chat. So "share" makes the PDF and
// hands it to the system share sheet, where WhatsApp is one of the choices
// and the file goes with it. The text-only link stays as a one-tap option
// for when the customer just wants to know the amount.
// ===========================================================================

import { Linking, Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { invoiceHtml } from "./invoice-html";
import { rupees } from "./money";
import { shopPrefs, clearShopPrefs } from "./shop-prefs";

// Kept as a re-export so the Settings screen has one obvious thing to call
// after a save.
export { clearShopPrefs as clearBillLook };

export async function printInvoice(args) {
  const look = await shopPrefs();
  // No size asked for means "whatever this shop usually prints on". A
  // counter with a till roll should not get A4 because that is the code's
  // default.
  const size = args.size || look.settings?.bill?.defaultSize || "a4";
  const html = invoiceHtml({ ...look, ...args, size });
  // On the web this opens the browser's own print dialog, which is also how
  // a desktop user prints to a PDF.
  await Print.printAsync({ html });
}

// Returns a file:// uri on a device. On the web expo-print has no file to
// give, so it prints instead and reports that there is nothing to share.
export async function invoicePdf(args) {
  const html = invoiceHtml({ ...(await shopPrefs()), ...args, size: "a4" });
  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return null;
  }
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function shareInvoice(args) {
  const uri = await invoicePdf(args);
  if (!uri) return false;
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: `Bill ${args.invoice?.number || ""}`.trim(),
    UTI: "com.adobe.pdf",
  });
  return true;
}

// A message, not an attachment. Opens WhatsApp with the text ready.
export function whatsappUrl({ shopName, invoice, party }) {
  const a = invoice?.amounts || {};
  const text = [
    shopName || "Our shop",
    `Bill ${invoice?.number || ""}`.trim(),
    `Amount ${rupees(a.total)}`,
    Number(a.balance) > 0 ? `Pending ${rupees(a.balance)}` : "Paid. Thank you.",
  ].join("\n");

  const digits = String(party?.phone || "").replace(/\D+/g, "").slice(-10);
  const to = digits.length === 10 ? `91${digits}` : "";
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

export async function openWhatsapp(args) {
  const url = whatsappUrl(args);
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// printing something that is not a bill
// ---------------------------------------------------------------------------
// Barcode label sheets and price lists are ordinary HTML with their own page
// rules, and they have no invoice to format. On the web this opens the
// browser's print dialog, where "Save as PDF" is one of the printers; on a
// phone it opens the system print sheet.
export async function printHtml(html) {
  await Print.printAsync({ html });
}
