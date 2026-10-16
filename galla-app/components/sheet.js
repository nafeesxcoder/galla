// ===========================================================================
// SHEETS
// ---------------------------------------------------------------------------
// Anything that interrupts the bill - picking an item, choosing a GST rate,
// adding a customer who is standing right there - comes up as a sheet over
// the bill rather than a new screen. The bill stays mounted underneath, so
// nothing typed into it is lost and coming back costs nothing.
//
// Two shapes only:
//
//   Sheet   covers the screen. For anything that needs the keyboard, a list
//           to scroll, or more than a few taps.
//   Choose  rises from the bottom. For picking one of a short list, where a
//           whole screen would be a lot of ceremony for one tap.
//
// Both close on the hardware back button, because on Android that is what
// back means and a sheet that ignores it feels broken.
// ===========================================================================

import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "./ui";
import { Icon } from "./icons";
import { colors, radius, space, TAP, wide } from "../lib/theme";

export function Sheet({ open, onClose, title, subtitle, right, children, scroll = true, footer }) {
  const insets = useSafeAreaInsets();

  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[{ padding: space(4), paddingBottom: space(10) }, wide]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1 }}>{children}</View>
  );

  return (
    <Modal
      visible={Boolean(open)}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      transparent={false}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[s.head, wide, { paddingTop: insets.top + space(2) }]}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            style={({ pressed }) => [s.closeBtn, pressed && { backgroundColor: colors.sunken }]}
          >
            <Icon name="close" size={22} color={colors.ink} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <T variant="h2" numberOfLines={1}>
              {title}
            </T>
            {subtitle ? (
              <T variant="tiny" numberOfLines={1}>
                {subtitle}
              </T>
            ) : null}
          </View>

          {right}
        </View>

        {body}

        {footer ? (
          <View style={[s.footer, wide, { paddingBottom: insets.bottom + space(3) }]}>{footer}</View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Pick one of a short list. options: [{ value, label, note }]
export function Choose({ open, onClose, title, options, value, onPick }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={Boolean(open)} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[s.tray, { paddingBottom: insets.bottom + space(3), maxWidth: 560, alignSelf: "center", left: 0, right: 0, marginHorizontal: "auto" }]}>
        <View style={s.grabber} />
        {title ? (
          <T variant="label" style={{ paddingHorizontal: space(4), marginBottom: space(2) }}>
            {title}
          </T>
        ) : null}
        <ScrollView style={{ maxHeight: 420 }}>
          {options.map((o) => {
            const on = String(o.value) === String(value);
            return (
              <Pressable
                key={String(o.value)}
                onPress={() => {
                  onPick(o.value);
                  onClose();
                }}
                style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.sunken }]}
              >
                <View style={{ flex: 1 }}>
                  <T style={on ? { fontWeight: "700", color: colors.brandInk } : undefined}>{o.label}</T>
                  {o.note ? <T variant="tiny">{o.note}</T> : null}
                </View>
                {on ? <Icon name="check" size={20} color={colors.brand} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// A field-shaped button. Looks like an input, opens a Choose or a Sheet.
export function PickerButton({ label, required, value, placeholder, hint, onPress, style, right }) {
  return (
    <View style={style}>
      {label ? (
        <T variant="label" style={{ marginBottom: space(1.5) }}>
          {label}
          {required ? <T style={{ color: colors.danger }}> *</T> : null}
        </T>
      ) : null}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        style={({ pressed }) => [s.picker, pressed && { backgroundColor: colors.sunken }]}
      >
        <T style={{ flex: 1, color: value ? colors.ink : "#9aa6b2" }} numberOfLines={1}>
          {value || placeholder}
        </T>
        {right ?? <Icon name="down" size={18} color={colors.ink3} />}
      </Pressable>
      {hint ? (
        <T variant="tiny" style={{ marginTop: space(1) }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(3),
    paddingBottom: space(2.5),
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  closeBtn: {
    width: TAP,
    height: TAP,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: space(4),
    paddingTop: space(3),
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(16,21,28,0.42)" },
  tray: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.panel,
    borderTopLeftRadius: radius.lg ?? 18,
    borderTopRightRadius: radius.lg ?? 18,
    paddingTop: space(2),
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lineStrong,
    alignSelf: "center",
    marginBottom: space(3),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    paddingHorizontal: space(4),
    minHeight: 52,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.panel,
    paddingHorizontal: space(3),
    minHeight: TAP,
  },
});
