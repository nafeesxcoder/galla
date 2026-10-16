// ===========================================================================
// HANDING A FILE TO THE PERSON USING THE APP
// ---------------------------------------------------------------------------
// Two completely different machines underneath, one function on top.
//
// On the web and in the desktop app, a file is a Blob and an anchor with a
// download attribute - the browser's own download, which lands in the usual
// folder and needs no permission.
//
// On a phone there is no downloads folder to write to. The file is written
// into the app's own cache and then handed to the system share sheet, which
// is where "save to Files", "send on WhatsApp" and "mail it to myself" all
// live. The cache is the right place deliberately: it is the one directory
// the system may clear on its own, and a backup the person has already sent
// somewhere should not sit on their phone forever.
//
// expo-file-system's API changed in SDK 54 - File and Paths, not the old
// writeAsStringAsync - and this is written against the new one.
// ===========================================================================

import { Platform } from "react-native";

/**
 * Writes text to a file and gives it to the person.
 *
 * Returns { ok, how } so the screen can say what happened rather than
 * guessing: "how" is "download" on the web and "share" on a phone.
 */
export async function saveTextFile(name, text, mime = "application/json") {
  if (Platform.OS === "web") {
    try {
      const blob = new Blob([text], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      // Appended before clicking: Firefox ignores a click on an anchor that
      // is not in the document.
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoked on the next tick rather than immediately - revoking while
      // the download is still starting cancels it in Safari.
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return { ok: true, how: "download" };
    } catch (e) {
      return { ok: false, how: "download", error: e?.message || "Could not start the download." };
    }
  }

  try {
    const { File, Paths } = require("expo-file-system");
    const Sharing = require("expo-sharing");

    const file = new File(Paths.cache, name);
    // overwrite, because taking a second backup on the same day must not
    // fail with "that file already exists".
    file.create({ overwrite: true, intermediates: true });
    file.write(text);

    if (!(await Sharing.isAvailableAsync())) {
      return { ok: false, how: "share", error: "This device has no way to share a file." };
    }

    await Sharing.shareAsync(file.uri, { mimeType: mime, UTI: "public.json", dialogTitle: name });
    return { ok: true, how: "share" };
  } catch (e) {
    return { ok: false, how: "share", error: e?.message || "Could not write the file." };
  }
}

/** A filename nobody has to think about, and that sorts by date in a folder. */
export function stampedName(prefix, extension = "json") {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${prefix}-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(
    d.getMinutes()
  )}.${extension}`;
}
