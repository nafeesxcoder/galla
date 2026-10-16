// ===========================================================================
// WHERE THE SERVER IS
// ---------------------------------------------------------------------------
// Only ever seen by whoever is setting the app up, and only when the address
// is not already fixed by the build.
//
// It exists because of the desktop app. One installer is handed to shops
// whose server is not ours - a chemist running the backend on the counter
// machine, a chain running it on a box in the back office - and "rebuild the
// installer to change a URL" is not a thing any of them is going to do. So
// the address is a setting, saved on the device, and the app says plainly
// when it has not been set.
//
// It checks the address before saving it. An address that was typed wrong and
// accepted silently produces exactly the same symptom as a server that is
// switched off, and whoever is setting this up has no way to tell them apart.
// ===========================================================================

import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Card, Field, Note, T } from "./ui";
import { Sheet } from "./sheet";
import { getApiUrl, setApiUrl, apiUrlIsFixed } from "../lib/api";
import { space } from "../lib/theme";

export function ServerSheet({ open, onClose, onSaved }) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState("idle"); // idle | checking | bad | ok
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (open) {
      setUrl(getApiUrl() || "http://localhost:4000");
      setState("idle");
      setDetail(null);
    }
  }, [open]);

  const tidy = (v) => {
    let out = String(v || "").trim().replace(/\/+$/, "");
    // The commonest two mistakes: no scheme at all, and a trailing /api.
    if (out && !/^https?:\/\//i.test(out)) out = `http://${out}`;
    out = out.replace(/\/api$/i, "");
    return out;
  };

  async function save() {
    const address = tidy(url);
    if (!address) {
      setState("bad");
      setDetail("Type the address of your server, for example http://localhost:4000");
      return;
    }

    setState("checking");
    setDetail(null);
    try {
      // /api/ping answers every origin and needs no sign-in, so it is the one
      // call that can tell "wrong address" from "not signed in yet".
      const res = await fetch(`${address}/api/ping`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setApiUrl(address);
      setState("ok");
      setTimeout(() => onSaved?.(address), 700);
    } catch {
      setState("bad");
      setDetail(
        `Nothing answered at ${address}. Check the address and that the server is running. ` +
          `If it is an older server without /api/ping, you can save it anyway.`
      );
    }
  }

  function saveAnyway() {
    const address = tidy(url);
    if (!address) return;
    setApiUrl(address);
    onSaved?.(address);
  }

  if (apiUrlIsFixed()) {
    return (
      <Sheet open={open} onClose={onClose} title="Server">
        <Note tone="info" title="Set when this app was built">
          {`This copy talks to ${getApiUrl()} and that cannot be changed from here.`}
        </Note>
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Where is your server?"
      subtitle="Set this once"
      footer={
        <Button
          title={state === "checking" ? "Checking…" : "Check and save"}
          kind="primary"
          size="lg"
          full
          busy={state === "checking"}
          onPress={save}
        />
      }
    >
      <Card>
        <Field
          label="Server address"
          required
          value={url}
          onChangeText={(v) => {
            setUrl(v);
            setState("idle");
          }}
          placeholder="http://localhost:4000"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          inputMode="url"
          autoFocus
          hint="The address your backend is running on, with the port."
        />
      </Card>

      {state === "ok" ? (
        <Note tone="good" title="Found it" style={{ marginTop: space(4) }}>
          Saved. Carrying on.
        </Note>
      ) : null}

      {state === "bad" ? (
        <View style={{ marginTop: space(4) }}>
          <Note tone="bad" title="No answer">
            {detail}
          </Note>
          <Button title="Save it anyway" full style={{ marginTop: space(3) }} onPress={saveAnyway} />
        </View>
      ) : null}

      <Note tone="info" style={{ marginTop: space(4) }}>
        On the same machine as the server this is usually http://localhost:4000. From another computer or a phone on
        the same wifi, use that machine's address instead — something like http://192.168.1.5:4000.
      </Note>
    </Sheet>
  );
}

export default ServerSheet;
