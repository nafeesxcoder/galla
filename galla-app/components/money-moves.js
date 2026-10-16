// ===========================================================================
// THE PIECES THE CASH AND BANK SCREENS SHARE
// ---------------------------------------------------------------------------
// A statement looks the same whether it is the drawer's or an account's, and
// so does the form for moving money between them. Written once here, because
// two copies would drift and the drawer would start adding up differently
// from the bank.
// ===========================================================================

import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Divider, Field, MoneyField, Row, T } from "./ui";
import { Icon } from "./icons";
import { Sheet, Choose, PickerButton } from "./sheet";
import { MOVE_KINDS, MOVE_SHAPE, createMove } from "../lib/data";
import { formatDate, rupees, today } from "../lib/money";
import { colors, radius, space } from "../lib/theme";

// Which icon goes with a row of a statement. The arrow direction is the
// thing being read at a glance; the label is for anybody who needs the
// detail.
const ROW_ICON = {
  received: "arrowIn",
  paid: "arrowOut",
  expense: "wallet",
  loan: "loan",
  "cash-to-bank": "bank",
  "bank-to-cash": "cash",
  "bank-to-bank": "swap",
  "bank-charge": "minus",
  "bank-interest": "plus",
  "cash-increase": "plus",
  "cash-decrease": "minus",
};

/**
 * A statement, with a running balance down the right.
 *
 * The running total is worked out BACKWARDS from the closing balance the
 * server sent, not forwards from the opening one. The list is capped at a
 * page, so counting forwards from the opening balance would be right only on
 * a shop with fewer transactions than the cap - and silently wrong on every
 * other one.
 */
export function Statement({ rows, balancePaise, emptyLabel = "Nothing yet." }) {
  if (!rows?.length) {
    return (
      <View style={st.empty}>
        <T variant="tiny">{emptyLabel}</T>
      </View>
    );
  }

  let running = balancePaise;
  const withRunning = rows.map((r) => {
    const after = running;
    running = running - r.inPaise + r.outPaise;
    return { ...r, afterPaise: after };
  });

  return (
    <View>
      {withRunning.map((r, i) => (
        <View key={r.id}>
          {i ? <Divider /> : null}
          <View style={st.row}>
            <View style={[st.icon, { backgroundColor: r.inPaise ? colors.brandSoft : colors.sunken }]}>
              <Icon
                name={ROW_ICON[r.kind] || "rupee"}
                size={16}
                color={r.inPaise ? colors.brandInk : colors.ink2}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T numberOfLines={1} style={{ fontWeight: "600" }}>
                {r.label}
              </T>
              <T variant="tiny" numberOfLines={1}>
                {formatDate(r.date)}
                {r.detail ? ` · ${r.detail}` : ""}
              </T>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <T
                num
                style={{
                  fontWeight: "700",
                  color: r.inPaise ? colors.brandInk : colors.ink,
                }}
              >
                {r.inPaise ? `+ ${rupees(r.inPaise)}` : `− ${rupees(r.outPaise)}`}
              </T>
              <T variant="tiny" num>
                {rupees(r.afterPaise)}
              </T>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * The form for moving money. One form for all seven kinds, because they only
 * differ in which of the two account pickers they need - and the shape comes
 * from MOVE_SHAPE, which the server checks too.
 */
export function MoveSheet({ open, onClose, kind, accounts, fixedAccountId, onDone }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => today());
  const [notes, setNotes] = useState("");
  // A shop with one bank account should never be asked which one. The
  // picker stays - a second account can be added at any time - but it opens
  // already answered, which is the difference between four taps and two for
  // the most common job in this screen.
  const only = accounts.length === 1 ? accounts[0].id : null;
  const [from, setFrom] = useState(only);
  const [to, setTo] = useState(only);
  const [picking, setPicking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const shape = MOVE_SHAPE[kind] || {};
  const label = MOVE_KINDS[kind] || "Move money";

  // The account this screen is about is filled in for whichever side needs
  // one, so a deposit opened from the HDFC screen does not ask which account
  // it is going into.
  const fromId = shape.from === "bank" ? (fixedAccountId && kind !== "bank-to-bank" ? fixedAccountId : from) : null;
  const toId = shape.to === "bank" ? (fixedAccountId && kind !== "bank-to-bank" ? fixedAccountId : to) : null;

  const needsFromPick = shape.from === "bank" && !fixedAccountId;
  const needsToPick = shape.to === "bank" && (!fixedAccountId || kind === "bank-to-bank");

  const options = accounts
    .filter((a) => String(a.id) !== String(kind === "bank-to-bank" ? fixedAccountId : ""))
    .map((a) => ({
      value: a.id,
      label: a.name,
      note: a.balancePaise === undefined ? a.bankName : `${a.bankName ? `${a.bankName} · ` : ""}${rupees(a.balancePaise)}`,
    }));

  const nameOf = (id) => accounts.find((a) => String(a.id) === String(id))?.name || "";

  function reset() {
    setAmount("");
    setNotes("");
    // Back to the preselected account, not to nothing - clearing it would
    // undo the one-account shortcut on the second deposit of the day.
    setFrom(only);
    setTo(only);
    setErr(null);
    setDate(today());
  }

  async function save() {
    setErr(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setErr("How much?");
      return;
    }
    setBusy(true);
    try {
      const move = await createMove({
        kind,
        amount: value,
        date,
        notes,
        fromAccountId: fromId || undefined,
        // bank-to-bank opened from an account screen moves OUT of that
        // account, so the fixed one is the "from" and the picked one is the
        // destination.
        toAccountId: (kind === "bank-to-bank" ? to : toId) || undefined,
      });
      reset();
      onDone?.(move);
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Could not save that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose?.();
      }}
      title={label}
      subtitle={
        kind === "cash-increase" || kind === "cash-decrease"
          ? "For when the drawer does not match and you know why"
          : undefined
      }
      footer={
        <Button
          title={busy ? "Saving…" : "Save"}
          kind="primary"
          size="lg"
          full
          busy={busy}
          disabled={busy}
          onPress={save}
        />
      }
    >
      <MoneyField
        label="Amount"
        required
        value={amount}
        onChangeText={(v) => setAmount(String(v).replace(/[^\d.]/g, ""))}
        placeholder="0"
        autoFocus
      />

      {needsFromPick ? (
        <PickerButton
          label={kind === "bank-to-bank" ? "Out of" : "Which account"}
          required
          value={nameOf(from)}
          placeholder="Choose an account"
          onPress={() => setPicking("from")}
          style={{ marginTop: space(4) }}
        />
      ) : null}

      {needsToPick ? (
        <PickerButton
          label={kind === "bank-to-bank" ? "Into" : "Which account"}
          required
          value={nameOf(to)}
          placeholder="Choose an account"
          onPress={() => setPicking("to")}
          style={{ marginTop: space(4) }}
        />
      ) : null}

      <Field
        label="Date"
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        style={{ marginTop: space(4) }}
      />

      <Field
        label="Note"
        value={notes}
        onChangeText={setNotes}
        placeholder={kind === "cash-to-bank" ? "evening deposit" : "what this was for"}
        style={{ marginTop: space(4) }}
      />

      {err ? (
        <View style={st.err}>
          <Icon name="warn" size={16} color={colors.danger} />
          <T variant="tiny" style={{ color: colors.danger, flex: 1 }}>
            {err}
          </T>
        </View>
      ) : null}

      <Choose
        open={picking === "from"}
        onClose={() => setPicking(null)}
        title="Out of"
        options={options}
        value={from}
        onPick={setFrom}
      />
      <Choose
        open={picking === "to"}
        onClose={() => setPicking(null)}
        title="Into"
        options={options}
        value={to}
        onPick={setTo}
      />
    </Sheet>
  );
}

/** The row of square buttons at the top of a money screen. */
export function Actions({ items }) {
  return (
    <Row style={{ marginTop: space(4), gap: space(2), flexWrap: "wrap" }}>
      {items.map((a) => (
        <Pressable
          key={a.label}
          onPress={a.onPress}
          accessibilityRole="button"
          accessibilityLabel={a.label}
          style={({ pressed }) => [st.action, pressed && { backgroundColor: colors.sunken }]}
        >
          <Icon name={a.icon} size={18} color={colors.brandInk} />
          <T variant="tiny" style={{ textAlign: "center", fontWeight: "600" }}>
            {a.label}
          </T>
        </Pressable>
      ))}
    </Row>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(3),
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { padding: space(5), alignItems: "center" },
  err: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    marginTop: space(4),
    padding: space(3),
    borderRadius: radius.sm,
    backgroundColor: "#fdecec",
  },
  action: {
    flexGrow: 1,
    flexBasis: 88,
    alignItems: "center",
    justifyContent: "center",
    gap: space(1.5),
    paddingVertical: space(3),
    paddingHorizontal: space(2),
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.panel,
  },
});
