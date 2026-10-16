// Where "email us" and "WhatsApp us" actually go, and how to open them.
//
// In lib rather than in the menu screen because expo-router treats every
// file under app/ as a route, and a route file that exports anything other
// than a component is a warning at best and a broken screen at worst.
//
// One place for the addresses, so the help screen and the menu can never
// disagree about where support lives.

import { Linking, Platform } from "react-native";

export const SUPPORT = {
  email: "support@timexsolution.com",
  // Placeholder until the real business number is in hand. Written here so
  // there is exactly one line to change.
  whatsapp: "919876543210",
};

/**
 * Opens a link and says whether it worked.
 *
 * canOpenURL is asked but not obeyed: on a desktop browser with no mail
 * client registered it answers false for a mailto:, and false is not the
 * same as "do not try". Only a real throw counts as a failure, so the caller
 * can tell the person the address instead of silently doing nothing.
 */
export async function openUrl(url) {
  try {
    if (Platform.OS !== "web") await Linking.canOpenURL(url).catch(() => false);
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export const mailto = (subject = "myGallaBook - help please") =>
  `mailto:${SUPPORT.email}?subject=${encodeURIComponent(subject)}`;

export const whatsappTo = (text = "") =>
  `https://wa.me/${SUPPORT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
