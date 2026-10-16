// ===========================================================================
// THE BARCODE SCANNER
// ---------------------------------------------------------------------------
// A phone camera instead of a ₹3,000 scanner gun. For a shop doing twenty
// bills a day that is the difference between using barcodes and not.
//
// Three decisions worth writing down.
//
// It does not close after a scan. A bill is four or five items, and a scanner
// that closes each time makes you reopen the camera four times. It beeps -
// visually, with the code it read - and waits for the next one. The running
// count is on screen so you can see it working.
//
// The same code twice in a row inside two seconds is ignored. A camera reads
// thirty frames a second and will happily add the same packet of biscuits
// twenty times while you are still lifting it away. The guard is on time, not
// on the code: scanning the same item twice on purpose, a few seconds apart,
// is a real thing people do and it means quantity two.
//
// The camera does not exist on every platform. On the web it needs a secure
// origin and the browser's own permission; in Expo Go on some devices it is
// not there at all. So this never assumes - it checks, and when it cannot
// scan it says what to do instead rather than showing a black rectangle.
// ===========================================================================

import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Button, Note, T } from "./ui";
import { Sheet } from "./sheet";
import { Icon } from "./icons";
import { colors, radius, space } from "../lib/theme";

// Loaded only when the scanner is actually opened. On the web the module
// pulls in the browser's media stack, and a shop that never scans should not
// pay for that on every page load.
let Camera = null;
function camera() {
  if (!Camera) {
    try {
      Camera = require("expo-camera");
    } catch {
      Camera = { missing: true };
    }
  }
  return Camera;
}

// The symbologies actually printed on Indian retail packaging. Narrowing the
// list makes the reader faster and stops it hunting for QR codes on a bag of
// rice.
const TYPES = ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "itf14", "qr"];

// On a phone the decoding is native: offline, instant, nothing to download.
// A browser is a different story. Chrome on Android and Safari on a Mac have
// a built-in BarcodeDetector; Chrome on Windows and Linux generally do not,
// and expo-camera then fetches about a megabyte of WebAssembly from a CDN to
// do the decoding itself.
//
// That fetch is not free and it is not reliable - no internet, a blocked CDN
// or a desktop build with a strict content policy and it fails, noisily, with
// a black rectangle on screen and five lines of WebAssembly errors in the
// console. So the browser case is checked up front and said out loud, with
// the download offered rather than started behind the shopkeeper's back.
function browserDecodes() {
  if (Platform.OS !== "web") return true;
  return typeof globalThis !== "undefined" && typeof globalThis.BarcodeDetector !== "undefined";
}

export function Scanner({ open, onClose, onScan, addedCount = 0 }) {
  const mod = open ? camera() : null;
  const available = Boolean(mod && !mod.missing && mod.CameraView);
  const [webDecoder, setWebDecoder] = useState("ask"); // ask | ready
  const needsDownload = available && !browserDecodes() && webDecoder !== "ready";

  useEffect(() => {
    if (!open) setWebDecoder("ask");
  }, [open]);

  // No preflight. Asking the decoder to read a blank one-pixel image answers
  // instantly without ever touching the WebAssembly, so it proves nothing -
  // which is worse than not checking, because it reports success and then the
  // camera silently reads nothing. The honest version is the gate above
  // (never download a megabyte without asking) plus the watchdog in Live
  // below, which notices when the camera has been open a while and read
  // nothing at all.
  function fetchDecoder() {
    setWebDecoder("ready");
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Scan a barcode"
      subtitle={addedCount ? `${addedCount} on the bill so far` : "Point the camera at the barcode"}
      scroll={false}
      footer={
        <Button
          title={addedCount ? `Done · ${addedCount} ${addedCount === 1 ? "item" : "items"}` : "Done"}
          kind={addedCount ? "primary" : "default"}
          size="lg"
          full
          onPress={onClose}
        />
      }
    >
      {needsDownload ? (
        <View style={{ padding: space(4) }}>
          <Note tone="info" title="This browser cannot read barcodes on its own">
            On the phone app scanning works straight away and offline. Here it needs about a megabyte of decoder
            downloaded first, and it will not work without internet.
          </Note>
          <Button
            title="Download it and scan anyway"
            kind="primary"
            size="lg"
            full
            style={{ marginTop: space(4) }}
            onPress={fetchDecoder}
          />
          <T variant="tiny" style={{ marginTop: space(3), textAlign: "center" }}>
            Or close this and type the code into the search box — it finds the item the same way.
          </T>
        </View>
      ) : available ? (
        <Live mod={mod} onScan={onScan} />
      ) : (
        <View style={{ padding: space(4) }}>
          <Note tone="warn" title="No camera here">
            This device or browser is not giving the app a camera. You can still type the code into the search box —
            it finds the item the same way.
          </Note>
        </View>
      )}
    </Sheet>
  );
}

function Live({ mod, onScan }) {
  const { CameraView, useCameraPermissions } = mod;
  const [permission, requestPermission] = useCameraPermissions();
  const [last, setLast] = useState(null);
  const [torch, setTorch] = useState(false);
  const [quiet, setQuiet] = useState(false);

  // The guard against a camera reading the same label thirty times a second.
  const lastCode = useRef({ code: null, at: 0 });

  useEffect(() => {
    if (!last) return undefined;
    const t = setTimeout(() => setLast(null), 1600);
    return () => clearTimeout(t);
  }, [last]);

  // A camera that has been open for twelve seconds and read nothing is either
  // pointed at the wrong thing, in bad light, or - on a browser - running a
  // decoder that never actually loaded. The screen cannot tell which, so it
  // says all three plainly instead of leaving somebody waving a phone at a
  // packet of biscuits wondering what is wrong.
  useEffect(() => {
    if (!permission?.granted) return undefined;
    const t = setTimeout(() => setQuiet(true), 12000);
    return () => clearTimeout(t);
  }, [permission?.granted]);

  if (!permission) {
    return (
      <View style={st.centre}>
        <T variant="sub">Waking the camera…</T>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ padding: space(4) }}>
        <Note tone="info" title="The camera needs your permission">
          {Platform.OS === "web"
            ? "Your browser will ask. It only reads barcodes — nothing is photographed, stored or sent anywhere."
            : "It only reads barcodes. Nothing is photographed, stored or sent anywhere."}
        </Note>
        <Button
          title="Allow the camera"
          kind="primary"
          size="lg"
          full
          style={{ marginTop: space(4) }}
          onPress={requestPermission}
        />
        {permission.canAskAgain === false ? (
          <T variant="tiny" style={{ marginTop: space(3), textAlign: "center" }}>
            You have turned it down before, so it has to be switched back on in your phone's settings for this app.
          </T>
        ) : null}
      </View>
    );
  }

  function handle({ data, type }) {
    const code = String(data || "").trim();
    if (!code) return;

    const now = Date.now();
    if (lastCode.current.code === code && now - lastCode.current.at < 2000) return;
    lastCode.current = { code, at: now };

    setQuiet(false);
    setLast({ code, type });
    onScan(code);
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={st.viewport}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: TYPES }}
          onBarcodeScanned={handle}
        />

        {/* A window to aim through. People hold a phone much closer than they
            need to, and a frame tells them where the camera is looking. */}
        <View pointerEvents="none" style={st.frameWrap}>
          <View style={[st.frame, last && { borderColor: colors.brand }]} />
        </View>

        <Pressable
          onPress={() => setTorch((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={torch ? "Turn the light off" : "Turn the light on"}
          style={[st.torch, torch && { backgroundColor: colors.brand }]}
        >
          <Icon name="camera" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={{ padding: space(4) }}>
        {last ? (
          <Note tone="good" title={`Read ${last.code}`}>
            Looking for it in your items. Point at the next one when you are ready.
          </Note>
        ) : quiet ? (
          <Note tone="warn" title="Not reading anything yet">
            Try more light, or hold it a little further back. If this is a browser rather than the phone app, the
            decoder may not have downloaded — typing the code into the search box always works.
          </Note>
        ) : (
          <T variant="sub" style={{ textAlign: "center" }}>
            Hold the barcode about a hand's width away. It reads on its own — there is no button to press.
          </T>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  viewport: {
    flex: 1,
    backgroundColor: "#0b0e12",
    overflow: "hidden",
  },
  frameWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  frame: {
    width: "72%",
    height: 150,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)",
    borderRadius: radius.md,
  },
  torch: {
    position: "absolute",
    right: space(4),
    bottom: space(4),
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
});

export default Scanner;
