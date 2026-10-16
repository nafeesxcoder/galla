// ===========================================================================
// FINDING AN ITEM, FINDING A CUSTOMER
// ---------------------------------------------------------------------------
// The item picker is the most touched control in the product, so it is built
// for a queue rather than for a demo:
//
//   - the sheet does not close when you pick something. A bill is four or
//     five items; closing after each one means opening it four more times.
//     It clears the box, says what was added, and waits for the next.
//   - typing is debounced by 180ms, and only the newest reply is used. A slow
//     answer for "ba" must not land after "basmati" and replace the list.
//   - an exact code match is taken straight away. That is what a scanner or a
//     hardware keyboard does: type the code, press Enter.
//   - nothing found is never a dead end. Adding it as a new item is the first
//     thing offered, with whatever was typed already in the name.
//
// The customer picker is the same shape, with one difference: empty is a real
// answer. A cash sale to somebody passing through does not need a name on
// file, and demanding one is how an app ends up with four hundred customers
// called "customer".
// ===========================================================================

import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Button, Divider, Note, Row, T } from "./ui";
import { Sheet } from "./sheet";
import { Icon } from "./icons";
import { listItems, listParties } from "../lib/data";
import { formatQty, rupees } from "../lib/money";
import { unitShort } from "../lib/units";
import { colors, radius, space } from "../lib/theme";

// ---------------------------------------------------------------------------
// the search box used by both
// ---------------------------------------------------------------------------
function SearchBar({ value, onChange, placeholder, onSubmit, inputRef, loading }) {
  const [focused, setFocused] = useState(false);
  const onFocusChange = setFocused;
  return (
    <View style={[s.searchWrap, focused && { borderColor: colors.brand }]}>
      <Icon name="search" size={20} color={colors.ink3} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9aa6b2"
        style={[s.searchInput, { outlineStyle: "none" }]}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        autoFocus
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        submitBehavior="submit"
        accessibilityLabel={placeholder}
      />
      {loading ? <ActivityIndicator size="small" color={colors.ink3} /> : null}
      {value ? (
        <Pressable onPress={() => onChange("")} hitSlop={10} accessibilityLabel="Clear">
          <Icon name="close" size={18} color={colors.ink3} />
        </Pressable>
      ) : null}
    </View>
  );
}

// Keeps only the newest search's answer. Shared by both pickers because both
// got it wrong in the same way before it was factored out.
function useSearch(fetcher, term, { when = true } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    if (!when) return undefined;
    const mine = ++seq.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await fetcher(term.trim());
        if (seq.current === mine) setRows(found);
      } catch {
        if (seq.current === mine) setRows([]);
      } finally {
        if (seq.current === mine) setLoading(false);
      }
    }, term.trim() ? 180 : 0);
    return () => clearTimeout(timer);
    // fetcher is stable per picker; term is what actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, when]);

  return { rows, loading, setRows };
}

// One place that decides what a typed or scanned code matches. The Enter key
// and the camera must agree, or scanning an item that typing finds would look
// like the scanner is broken.
export async function findByCode(term) {
  const text = String(term || "").trim();
  if (!text) return null;
  try {
    const found = (await listItems({ search: text, limit: 5 })).rows;
    const lower = text.toLowerCase();
    return (
      found.find((r) => r.code && r.code.toLowerCase() === lower) ||
      found.find((r) => r.name && r.name.toLowerCase() === lower) ||
      (found.length === 1 ? found[0] : null)
    );
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// items
// ---------------------------------------------------------------------------
export function ItemPicker({ open, onClose, onPick, onCreate, onScanPress, addedCount = 0 }) {
  const [q, setQ] = useState("");
  const [added, setAdded] = useState(null);
  const input = useRef(null);

  const { rows, loading } = useSearch(
    async (term) => (await listItems(term ? { search: term, limit: 12 } : { limit: 20 })).rows,
    q,
    { when: open }
  );

  useEffect(() => {
    if (!open) {
      setQ("");
      setAdded(null);
    }
  }, [open]);

  function take(item) {
    onPick(item);
    setAdded(item.name);
    setQ("");
    input.current?.focus();
  }

  // A scanner types the whole code and sends Enter inside the debounce, so
  // when Enter arrives the list is often still the previous one. Rather than
  // guess from the length of the text - a shop's own codes are frequently
  // three or four characters - the server is asked once, directly. That way
  // Enter always does something.
  async function submit() {
    const term = q.trim();
    if (!term) return;

    const exact = rows.find((r) => r.code && r.code.toLowerCase() === term.toLowerCase());
    if (exact) return take(exact);

    const hit = await findByCode(term);
    if (hit) return take(hit);
    onCreate(term);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add an item"
      subtitle={addedCount ? `${addedCount} on the bill so far` : "Type a name, a code, or scan"}
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
      <View style={{ padding: space(4), paddingBottom: space(2) }}>
        <Row gap={2}>
          <View style={{ flex: 1 }}>
            <SearchBar
              inputRef={input}
              value={q}
              onChange={setQ}
              onSubmit={submit}
              loading={loading}
              placeholder="Rice, soap, RICE5…"
            />
          </View>
          {onScanPress ? (
            <Pressable
              onPress={onScanPress}
              accessibilityRole="button"
              accessibilityLabel="Scan a barcode"
              style={({ pressed }) => [s.scanBtn, pressed && { opacity: 0.85 }]}
            >
              <Icon name="camera" size={22} color="#fff" />
            </Pressable>
          ) : null}
        </Row>
        {added ? (
          <Note tone="good" style={{ marginTop: space(3) }}>
            {`${added} added. Next one?`}
          </Note>
        ) : null}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={{ paddingBottom: space(8) }}
        ListHeaderComponent={
          q.trim() ? (
            <>
              <Pressable
                onPress={() => onCreate(q.trim())}
                style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.sunken }]}
              >
                <View style={s.plusCircle}>
                  <Icon name="plus" size={18} color={colors.brandInk} />
                </View>
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: "600", color: colors.brandInk }}>{`Add “${q.trim()}”`}</T>
                  <T variant="tiny">As a new item in your list</T>
                </View>
              </Pressable>
              <Divider />
            </>
          ) : null
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={{ padding: space(6), alignItems: "center" }}>
              <T variant="sub" style={{ textAlign: "center" }}>
                {q.trim() ? "Nothing by that name." : "No items yet. Add the first one above."}
              </T>
            </View>
          )
        }
        renderItem={({ item: r }) => (
          <Pressable
            onPress={() => take(r)}
            style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.sunken }]}
          >
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: "600" }} numberOfLines={1}>
                {r.name}
              </T>
              <T variant="tiny">
                {r.type === "service" ? "Service" : `${formatQty(r.stock)} ${unitShort(r.unit)} in stock`}
                {r.code ? ` · ${r.code}` : ""}
                {r.taxRate ? ` · ${r.taxRate}% GST` : ""}
              </T>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <T style={{ fontWeight: "700" }} num>
                {rupees(r.salePaise)}
              </T>
              {r.isOut && r.type !== "service" ? (
                <T variant="tiny" style={{ color: colors.danger }}>
                  Out of stock
                </T>
              ) : null}
            </View>
            <Icon name="plus" size={20} color={colors.brand} />
          </Pressable>
        )}
      />
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// customers and suppliers
// ---------------------------------------------------------------------------
export function PartyPicker({ open, onClose, onPick, onCreate, forSupplier }) {
  const [q, setQ] = useState("");
  const input = useRef(null);

  const { rows, loading } = useSearch(
    async (term) => (await listParties(term ? { search: term, limit: 12 } : { limit: 25 })).rows,
    q,
    { when: open }
  );

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const noun = forSupplier ? "supplier" : "customer";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={forSupplier ? "Choose a supplier" : "Choose a customer"}
      subtitle="Search by name or phone number"
      scroll={false}
    >
      <View style={{ padding: space(4), paddingBottom: space(2) }}>
        <SearchBar
          inputRef={input}
          value={q}
          onChange={setQ}
          loading={loading}
          placeholder="Name or 10 digit number"
          onSubmit={() => {
            if (rows.length === 1) {
              onPick(rows[0]);
              onClose();
            }
          }}
        />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={{ paddingBottom: space(8) }}
        ListHeaderComponent={
          <>
            <Pressable
              onPress={() => onCreate(q.trim())}
              style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.sunken }]}
            >
              <View style={s.plusCircle}>
                <Icon name="plus" size={18} color={colors.brandInk} />
              </View>
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: "600", color: colors.brandInk }}>
                  {q.trim() ? `Add “${q.trim()}”` : `New ${noun}`}
                </T>
                <T variant="tiny">Name and number is all it takes</T>
              </View>
            </Pressable>
            <Divider />
            {!q.trim() ? (
              <>
                <Pressable
                  onPress={() => {
                    onPick(null);
                    onClose();
                  }}
                  style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.sunken }]}
                >
                  <View style={{ flex: 1 }}>
                    <T style={{ fontWeight: "600" }}>Walk-in — no name</T>
                    <T variant="tiny">For a cash sale you do not need to record</T>
                  </View>
                </Pressable>
                <Divider />
              </>
            ) : null}
          </>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={{ padding: space(6), alignItems: "center" }}>
              <T variant="sub">{q.trim() ? "Nobody by that name yet." : "No one saved yet."}</T>
            </View>
          )
        }
        renderItem={({ item: r }) => (
          <Pressable
            onPress={() => {
              onPick(r);
              onClose();
            }}
            style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.sunken }]}
          >
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: "600" }} numberOfLines={1}>
                {r.name}
              </T>
              <T variant="tiny">
                {r.phone || "No number"}
                {r.stateName ? ` · ${r.stateName}` : ""}
              </T>
            </View>
            {r.owesUs ? (
              <View style={{ alignItems: "flex-end" }}>
                <T style={{ fontWeight: "700", color: colors.danger }} num>
                  {rupees(r.owesUs)}
                </T>
                <T variant="tiny">owes you</T>
              </View>
            ) : r.weOwe ? (
              <View style={{ alignItems: "flex-end" }}>
                <T style={{ fontWeight: "700" }} num>
                  {rupees(r.weOwe)}
                </T>
                <T variant="tiny">you owe</T>
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </Sheet>
  );
}

const s = StyleSheet.create({
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.panel,
    paddingHorizontal: space(3),
    minHeight: 52,
  },
  searchInput: { flex: 1, fontSize: 17, color: colors.ink, paddingVertical: space(2) },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    minHeight: 64,
    backgroundColor: colors.panel,
  },
  scanBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  plusCircle: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
