// ===========================================================================
// THE SHARED PIECES
// ---------------------------------------------------------------------------
// Buttons, fields, cards, pills, empty and loading states. Everything in the
// app is built out of these so a screen never has to invent its own spacing.
// ===========================================================================

import { forwardRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, radius, shadow, space, TAP, text, wide } from "../lib/theme";
import { Icon } from "./icons";

// ---------------------------------------------------------------------------
// text
// ---------------------------------------------------------------------------
export function T({ style, variant = "body", num, children, ...rest }) {
  return (
    <Text style={[text[variant], num && text.num, style]} {...rest}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// button
// ---------------------------------------------------------------------------
export function Button({
  title,
  onPress,
  kind = "default",
  size = "md",
  disabled,
  busy,
  icon,
  style,
  full,
}) {
  const bg =
    kind === "primary" ? colors.brand : kind === "ghost" ? "transparent" : colors.panel;
  const fg =
    kind === "primary" ? colors.white : kind === "danger" ? colors.danger : colors.ink;
  const border =
    kind === "primary"
      ? colors.brand
      : kind === "ghost"
      ? "transparent"
      : kind === "danger"
      ? "#e9bfc1"
      : colors.lineStrong;

  const pad = size === "lg" ? space(4) : size === "sm" ? space(2) : space(3);
  const minH = size === "lg" ? 54 : size === "sm" ? 36 : TAP;

  return (
    <Pressable
      onPress={disabled || busy ? undefined : onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        s.btn,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingHorizontal: pad,
          minHeight: minH,
          opacity: disabled || busy ? 0.5 : pressed ? 0.85 : 1,
        },
        full && { alignSelf: "stretch" },
        style,
      ]}
    >
      {/* An icon may be given either as a name or as an element. A bare
          string used to be rendered as-is, which puts a text node straight
          inside a View - React Native logs "Unexpected text node" and the
          word appears on the button next to its own label. Naming the icon
          is the obvious thing to write, so it is the thing that works. */}
      {busy ? (
        <ActivityIndicator size="small" color={fg} />
      ) : typeof icon === "string" ? (
        <Icon name={icon} size={size === "lg" ? 20 : size === "sm" ? 15 : 18} color={fg} />
      ) : (
        icon
      )}
      <Text
        style={[
          s.btnText,
          { color: fg, fontSize: size === "lg" ? 17 : size === "sm" ? 13.5 : 15.5 },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// card
// ---------------------------------------------------------------------------
export function Card({ children, style, pad = true }) {
  return <View style={[s.card, pad && { padding: space(4) }, style]}>{children}</View>;
}

export function CardHead({ title, right }) {
  return (
    <View style={s.cardHead}>
      <T variant="h2" style={{ flex: 1 }}>
        {title}
      </T>
      {right}
    </View>
  );
}

// ---------------------------------------------------------------------------
// fields
// ---------------------------------------------------------------------------
export const Field = forwardRef(function Field(
  { label, hint, error, required, style, inputStyle, prefix, onFocus, onBlur, ...rest },
  ref
) {
  // The browser draws its own focus ring, which does not match anything else
  // here and looks like a validation error. It is turned off on the input
  // itself and the whole box is given a brand-coloured border instead, so a
  // keyboard user on the desktop build can still see where they are.
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label ? (
        <T variant="label" style={{ marginBottom: space(1.5) }}>
          {label}
          {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
        </T>
      ) : null}

      <View
        style={[
          s.inputWrap,
          focused && { borderColor: colors.brand },
          error && { borderColor: colors.danger },
          rest.editable === false && { backgroundColor: colors.sunken },
        ]}
      >
        {prefix ? (
          <T variant="sub" style={{ marginRight: space(1) }}>
            {prefix}
          </T>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor="#9aa6b2"
          style={[s.input, inputStyle]}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>

      {hint && !error ? (
        <T variant="tiny" style={{ marginTop: space(1) }}>
          {hint}
        </T>
      ) : null}
      {error ? (
        <T variant="tiny" style={{ marginTop: space(1), color: colors.danger }}>
          {error}
        </T>
      ) : null}
    </View>
  );
});

// Money always right-aligned with a rupee sign welded on, so a column of them
// lines up and nobody has to hunt for the decimal point.
export const MoneyField = forwardRef(function MoneyField(props, ref) {
  return (
    <Field
      ref={ref}
      prefix="₹"
      keyboardType="decimal-pad"
      inputMode="decimal"
      inputStyle={[text.num, { textAlign: "right" }]}
      placeholder="0.00"
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// pills and notices
// ---------------------------------------------------------------------------
const PILL = {
  paid: { bg: colors.brandSoft, fg: colors.brandInk, line: colors.brandLine },
  partial: { bg: colors.warnSoft, fg: colors.warn, line: "#f0dcb6" },
  unpaid: { bg: colors.dangerSoft, fg: colors.danger, line: "#efc9cb" },
  cancelled: { bg: colors.sunken, fg: colors.ink3, line: colors.lineStrong },
  info: { bg: colors.infoSoft, fg: colors.info, line: "#c9dcf3" },
  draft: { bg: colors.infoSoft, fg: colors.info, line: "#c9dcf3" },

  // The names above are a bill's payment state, which is most of what a pill
  // says in this app. These three are for everything else - a licence that
  // is active, a plan about to run out, a key that was cancelled - so those
  // screens do not have to label a live licence "paid" to get a green pill.
  ok: { bg: colors.brandSoft, fg: colors.brandInk, line: colors.brandLine },
  warn: { bg: colors.warnSoft, fg: colors.warn, line: "#f0dcb6" },
  bad: { bg: colors.dangerSoft, fg: colors.danger, line: "#efc9cb" },
};

export function Pill({ children, tone = "info", style }) {
  const c = PILL[tone] || PILL.info;
  return (
    <View style={[s.pill, { backgroundColor: c.bg, borderColor: c.line }, style]}>
      <Text style={[s.pillText, { color: c.fg }]}>{children}</Text>
    </View>
  );
}

const NOTE = {
  info: { bg: colors.infoSoft, fg: "#16477d", line: "#c9dcf3" },
  warn: { bg: colors.warnSoft, fg: "#6f4a00", line: "#f0dcb6" },
  bad: { bg: colors.dangerSoft, fg: "#8a1c22", line: "#efc9cb" },
  good: { bg: colors.brandSoft, fg: colors.brandInk, line: colors.brandLine },
};

export function Note({ tone = "info", title, children, style }) {
  const c = NOTE[tone] || NOTE.info;
  return (
    <View style={[s.note, { backgroundColor: c.bg, borderColor: c.line }, style]}>
      {title ? (
        <Text style={[s.noteTitle, { color: c.fg }]}>{title}</Text>
      ) : null}
      {/* A loose string among elements would be a text node directly inside
          a View, which React Native refuses to lay out and reports as
          "Unexpected text node" behind a full-screen error overlay. Rather
          than make every caller remember, any bare string is wrapped here -
          including when it sits beside an element. */}
      {Array.isArray(children)
        ? children.map((child, i) =>
            typeof child === "string" || typeof child === "number" ? (
              <Text key={`t${i}`} style={[s.noteText, { color: c.fg }]}>
                {child}
              </Text>
            ) : (
              child
            )
          )
        : typeof children === "string" || typeof children === "number" ? (
          <Text style={[s.noteText, { color: c.fg }]}>{children}</Text>
        ) : (
          children
        )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// states
// ---------------------------------------------------------------------------
export function Loading({ label }) {
  return (
    <View style={s.centre}>
      <ActivityIndicator color={colors.brand} />
      {label ? (
        <T variant="sub" style={{ marginTop: space(2) }}>
          {label}
        </T>
      ) : null}
    </View>
  );
}

export function Empty({ title, body, action, icon }) {
  return (
    <View style={s.centre}>
      {/* Named or given as an element, same as Button. A bare string here
          put a text node inside a View, which React Native warns about and
          which draws the icon's NAME above the heading. */}
      {icon ? (
        <View style={{ marginBottom: space(2) }}>
          {typeof icon === "string" ? <Icon name={icon} size={30} color={colors.ink3} /> : icon}
        </View>
      ) : null}
      <T variant="h2" style={{ textAlign: "center" }}>
        {title}
      </T>
      {body ? (
        <T variant="sub" style={{ textAlign: "center", marginTop: space(1.5), maxWidth: 320 }}>
          {body}
        </T>
      ) : null}
      {action ? <View style={{ marginTop: space(4) }}>{action}</View> : null}
    </View>
  );
}

// Offline gets its own words because "try again" is the right advice there
// and almost nowhere else.
export function ErrorState({ error, onRetry }) {
  const offline = error?.isOffline;
  return (
    <View style={{ padding: space(4) }}>
      <Note
        tone={offline ? "warn" : "bad"}
        title={offline ? "Cannot reach the server" : "Something went wrong"}
      >
        {offline
          ? error?.message || "The app is running but the server is not answering. Nothing has been lost."
          : error?.message || "Please try again."}
      </Note>
      {onRetry ? (
        <Button title="Try again" onPress={onRetry} style={{ marginTop: space(3), alignSelf: "flex-start" }} />
      ) : null}
    </View>
  );
}

export function Row({ children, style, gap = 2 }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap: space(gap) }, style]}>{children}</View>;
}

export function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: colors.line }, style]} />;
}

export function Screen({ children, style, scroll = true, refreshControl }) {
  if (!scroll) {
    return <View style={[{ flex: 1, backgroundColor: colors.bg }, wide, style]}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[{ padding: space(4), paddingBottom: space(16) }, wide, style]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space(2),
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  btnText: { fontWeight: "600" },

  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    ...shadow.card,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    marginBottom: space(3),
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.panel,
    paddingHorizontal: space(3),
    minHeight: TAP,
  },
  input: {
    flex: 1,
    // Removed because the box around it carries the focus state instead.
    outlineStyle: "none",
    // On the web a text input carries an intrinsic width of about twenty
    // characters, and a flex item will not shrink below its own content
    // width unless this is said out loud. Without it a narrow field - the
    // quantity box on a bill line, say - overflows its own border and the
    // digits land somewhere else on the row.
    minWidth: 0,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: space(2.5),
  },

  pill: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space(2),
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  pillText: { fontSize: 11.5, fontWeight: "700" },

  note: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: space(3),
  },
  noteTitle: { fontWeight: "700", marginBottom: 3, fontSize: 14 },
  noteText: { fontSize: 14, lineHeight: 20 },

  centre: {
    alignItems: "center",
    justifyContent: "center",
    padding: space(8),
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingVertical: space(3),
    minHeight: TAP,
  },
});

// ---------------------------------------------------------------------------
// a setting that is on or off
// ---------------------------------------------------------------------------
// The whole row is the target, not just the switch. A 32-pixel switch is a
// miss waiting to happen with a thumb, and the label is what somebody is
// actually looking at when they reach for it.
export function Toggle({ label, hint, value, onChange, disabled }) {
  const on = Boolean(value);
  return (
    <Pressable
      onPress={disabled ? undefined : () => onChange(!on)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled: Boolean(disabled) }}
      accessibilityLabel={label}
      style={({ pressed }) => [s.toggle, pressed && !disabled && { backgroundColor: colors.sunken }]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[text.body, { fontWeight: "600", color: disabled ? colors.ink3 : colors.ink }]}>
          {label}
        </Text>
        {hint ? <Text style={[text.tiny, { marginTop: 2 }]}>{hint}</Text> : null}
      </View>
      <Switch
        value={on}
        onValueChange={disabled ? undefined : onChange}
        disabled={disabled}
        trackColor={{ true: colors.brand, false: colors.lineStrong }}
        thumbColor="#fff"
      />
    </Pressable>
  );
}
