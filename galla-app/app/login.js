// ===========================================================================
// SIGNING IN
// ---------------------------------------------------------------------------
// Phone number, then the code. Two steps, nothing else - no password to
// forget, no email a shopkeeper may not have.
//
// The six boxes are one hidden input underneath six drawn cells. Six separate
// inputs is the obvious way to build it and it is the wrong one: paste stops
// working, backspace across a boundary misbehaves, and on Android the
// keyboard's autofill picks the wrong box. One input avoids all of it and
// still looks like six.
// ===========================================================================

import { forwardRef, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Field, Note, Screen, T } from "../components/ui";
import { useSession } from "../lib/session";
import { ServerSheet } from "../components/server";
import { getApiUrl, apiUrlIsFixed } from "../lib/api";
import { colors, radius, space, text, TAP } from "../lib/theme";

const OTP_LENGTH = 6;

export default function Login() {
  const { requestOtp, verifyOtp } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [serverSheet, setServerSheet] = useState(false);

  const otpRef = useRef(null);

  useEffect(() => {
    if (!seconds) return undefined;
    const t = setTimeout(() => setSeconds((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const phoneOk = /^[6-9]\d{9}$/.test(phone);

  async function sendCode() {
    setErr(null);
    if (!phoneOk) {
      setErr("Enter a 10 digit mobile number starting 6, 7, 8 or 9.");
      return;
    }
    setBusy(true);
    try {
      const data = await requestOtp(phone);
      setDevCode(data?.devCode ?? null);
      setStep("code");
      setSeconds(30);
      setTimeout(() => otpRef.current?.focus(), 250);
    } catch (e) {
      setErr(messageFor(e));
    } finally {
      setBusy(false);
    }
  }

  async function check(value) {
    const entered = value ?? code;
    if (entered.length !== OTP_LENGTH) return;
    setErr(null);
    setBusy(true);
    try {
      await verifyOtp(phone, entered);
      router.replace("/");
    } catch (e) {
      setErr(messageFor(e));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen style={{ paddingTop: insets.top + space(10), justifyContent: "center" }}>
        <View style={{ alignItems: "center", marginBottom: space(8) }}>
          <View style={s.mark}>
            <T style={{ color: "#04231a", fontWeight: "800", fontSize: 24 }}>G</T>
          </View>
          <T variant="h1" style={{ marginTop: space(3) }}>
            myGallaBook
          </T>
          <T variant="sub" style={{ marginTop: space(1) }}>
            Billing for your shop
          </T>
        </View>

        {err ? <Note tone="bad" style={{ marginBottom: space(4) }}>{err}</Note> : null}

        {/* Only offered when it would help: the address is not fixed by the
            build, and either nothing is set or what is set did not answer. */}
        {!apiUrlIsFixed() && (!getApiUrl() || err) ? (
          <Button
            title={getApiUrl() ? `Server: ${getApiUrl()}` : "Set your server address"}
            kind={getApiUrl() ? "ghost" : "primary"}
            full
            style={{ marginBottom: space(4) }}
            onPress={() => setServerSheet(true)}
          />
        ) : null}

        {step === "phone" ? (
          <>
            <Field
              label="Mobile number"
              hint="We send a code to this number."
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/\D+/g, "").slice(0, 10))}
              keyboardType="number-pad"
              inputMode="numeric"
              placeholder="98765 43210"
              prefix="+91"
              autoFocus
              maxLength={10}
              returnKeyType="go"
              onSubmitEditing={sendCode}
              editable={!busy}
            />
            <Button
              title="Send code"
              kind="primary"
              size="lg"
              onPress={sendCode}
              busy={busy}
              disabled={!phoneOk}
              full
              style={{ marginTop: space(5) }}
            />
          </>
        ) : (
          <>
            <T variant="label" style={{ textAlign: "center" }}>
              Code sent to +91 {phone}
            </T>

            <OtpBoxes
              ref={otpRef}
              value={code}
              onChange={(v) => {
                setCode(v);
                if (v.length === OTP_LENGTH) check(v);
              }}
              disabled={busy}
            />

            {/* Development only. The server refuses to echo the code once it
                is running in production, so this can never leak a real one. */}
            {devCode ? (
              <Pressable
                onPress={() => {
                  setCode(String(devCode));
                  check(String(devCode));
                }}
              >
                <Note tone="warn" style={{ marginTop: space(4) }}>
                  {`Development: the code is ${devCode}. Tap to fill it in.`}
                </Note>
              </Pressable>
            ) : null}

            <Button
              title={seconds ? `Send again in ${seconds}s` : "Send the code again"}
              kind="ghost"
              onPress={seconds ? undefined : sendCode}
              disabled={Boolean(seconds) || busy}
              style={{ marginTop: space(4) }}
            />
            <Button
              title="Change the number"
              kind="ghost"
              onPress={() => {
                setStep("phone");
                setCode("");
                setErr(null);
              }}
            />
          </>
        )}
        <ServerSheet
          open={serverSheet}
          onClose={() => setServerSheet(false)}
          onSaved={() => {
            setServerSheet(false);
            setErr(null);
          }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
const OtpBoxes = forwardRef(function OtpBoxes({ value, onChange, disabled }, ref) {
  const cells = Array.from({ length: OTP_LENGTH });
  return (
    <Pressable onPress={() => ref?.current?.focus()} style={{ marginTop: space(5) }}>
      <View style={[s.otpRow, { pointerEvents: "none" }]}>
        {cells.map((_, i) => (
          <View key={i} style={[s.otpCell, i === value.length && s.otpCellActive]}>
            <T style={{ fontSize: 22, fontWeight: "700" }}>{value[i] ?? ""}</T>
          </View>
        ))}
      </View>

      <TextInput
        ref={ref}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D+/g, "").slice(0, OTP_LENGTH))}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={OTP_LENGTH}
        editable={!disabled}
        autoFocus
        // The one real input, invisible but focusable, sitting exactly over
        // the drawn cells so a tap anywhere opens the keyboard.
        style={s.otpInput}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        accessibilityLabel="Six digit code"
      />
    </Pressable>
  );
});

function messageFor(e) {
  // The offline message now carries the actual diagnosis in development -
  // whether nothing is listening or CORS refused it - so it is passed
  // through rather than flattened into "check the connection".
  if (e?.noServer) return "No server address set yet. Set it below and this will work.";
  if (e?.isOffline) return e.message || "Could not reach the server. Check the connection and try again.";
  if (e?.status === 429) return "Too many tries. Wait a minute and try again.";
  if (e?.status === 400 || e?.status === 401) return e.message || "That code is not right.";
  return e?.message || "Something went wrong. Please try again.";
}

const s = StyleSheet.create({
  mark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#12d08f",
    alignItems: "center",
    justifyContent: "center",
  },
  otpRow: { flexDirection: "row", gap: space(2), justifyContent: "center" },
  otpCell: {
    width: 46,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  otpCellActive: { borderColor: colors.brand },
  otpInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    opacity: 0,
    fontSize: 1,
  },
});
