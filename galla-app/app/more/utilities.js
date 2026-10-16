// ===========================================================================
// UTILITIES
// ---------------------------------------------------------------------------
// The jobs that are not part of a working day but have to happen anyway:
// printing shelf labels, putting prices up across the board, finding out what
// is about to run out, and checking the books for the kinds of mistake that
// hide for months.
//
// All of it reads the same data the rest of the app does. Nothing here has a
// private copy of anything, so a price changed in bulk is the same price the
// billing screen picks up on the next tap.
// ===========================================================================

import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  Divider,
  ErrorState,
  Field,
  Loading,
  Note,
  Row,
  Screen,
  T,
} from "../../components/ui";
import { Icon } from "../../components/icons";
import { Choose, PickerButton } from "../../components/sheet";
import { useSession } from "../../lib/session";
import { expiringBatches, listAllItems, listAllParties, listAllInvoices, setSalePrice } from "../../lib/data";
import { code128Html } from "../../lib/barcode";
import { isValidGstin } from "../../lib/gst-states";
import { formatDate, formatQty, rupees } from "../../lib/money";
import { printHtml } from "../../lib/print";
import { colors, radius, space } from "../../lib/theme";

const TOOLS = [
  { id: "labels", icon: "barcode", label: "Print barcode labels", note: "Shelf labels with a scannable code" },
  { id: "prices", icon: "percent", label: "Change prices in bulk", note: "Put a whole category up or down" },
  { id: "lowstock", icon: "warn", label: "Items running out", note: "What to reorder" },
  { id: "expiry", icon: "calendar", label: "Stock expiring soon", note: "Before it is worthless" },
  { id: "pricelist", icon: "list", label: "Your items as a price list", note: "To print or send" },
  { id: "verify", icon: "check", label: "Check my data", note: "Find the quiet mistakes" },
];

export default function Utilities() {
  const params = useLocalSearchParams();
  const wanted = String(params?.tool || "");
  const [tool, setTool] = useState(TOOLS.some((t) => t.id === wanted) ? wanted : null);

  if (!tool) {
    return (
      <Screen>
        <Card pad={false}>
          {TOOLS.map((t, i) => (
            <View key={t.id}>
              {i ? <Divider /> : null}
              <Pressable
                onPress={() => setTool(t.id)}
                accessibilityRole="button"
                accessibilityLabel={t.label}
                style={({ pressed }) => [st.row, pressed && { backgroundColor: colors.sunken }]}
              >
                <View style={st.icon}>
                  <Icon name={t.icon} size={18} color={colors.brandInk} />
                </View>
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: "650" }}>{t.label}</T>
                  <T variant="tiny">{t.note}</T>
                </View>
                <Icon name="chevron" size={18} color={colors.ink3} />
              </Pressable>
            </View>
          ))}
        </Card>
      </Screen>
    );
  }

  const Tool = { labels: Labels, prices: Prices, lowstock: LowStock, expiry: Expiry, pricelist: PriceList, verify: Verify }[
    tool
  ];

  return (
    <Screen>
      <Button
        title="All utilities"
        kind="ghost"
        icon="back"
        onPress={() => setTool(null)}
        style={{ alignSelf: "flex-start", marginBottom: space(3) }}
      />
      <Tool />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// shared: load every item once
// ---------------------------------------------------------------------------
function useItems() {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });

  const load = useCallback(async () => {
    try {
      const { rows: found } = await listAllItems();
      setRows(found);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, state, reload: load };
}

// ---------------------------------------------------------------------------
// BARCODE LABELS
// ---------------------------------------------------------------------------
function Labels() {
  const { shop } = useSession();
  const { rows, state } = useItems();
  const [picked, setPicked] = useState({});
  const [perItem, setPerItem] = useState("1");
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState("");

  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState error={state.error} />;

  // Only goods get a label. A service has nothing to stick one on.
  const printable = rows.filter((i) => i.type !== "service");
  const chosen = printable.filter((i) => picked[i.id]);

  async function print() {
    setSaid("");
    setBusy(true);
    try {
      const n = Math.max(1, Math.min(50, Number(perItem) || 1));
      const cells = [];
      for (const item of chosen) {
        // The item's own barcode if it has one, otherwise its code, otherwise
        // an id-based one - so every label scans to something unique even for
        // an item nobody gave a code.
        const value = item.code || `GAL${item.id}`;
        const bars = code128Html(value, { module: 0.33, height: 12 });
        for (let k = 0; k < n; k++) {
          cells.push(`
            <div class="label">
              <div class="name">${escapeHtml(item.name).slice(0, 40)}</div>
              ${bars || '<div class="nobars">code cannot be printed as bars</div>'}
              <div class="code">${escapeHtml(value)}</div>
              <div class="price">${rupees(item.salePaise)}</div>
            </div>`);
        }
      }

      await printHtml(`<!doctype html><html><head><meta charset="utf-8"><style>
        @page { margin: 6mm; }
        body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; }
        h1 { font-size: 11pt; margin: 0 0 4mm; }
        .sheet { display: flex; flex-wrap: wrap; gap: 3mm; }
        .label { width: 38mm; border: 0.2mm dashed #bbb; padding: 2mm; text-align: center;
                 page-break-inside: avoid; }
        .name { font-size: 7pt; font-weight: 600; height: 7mm; overflow: hidden; line-height: 3.5mm; }
        .code { font-size: 6pt; letter-spacing: 0.4pt; margin-top: 0.5mm; font-family: monospace; }
        .price { font-size: 10pt; font-weight: 800; margin-top: 0.5mm; }
        .nobars { font-size: 6pt; color: #b00; height: 12mm; }
      </style></head><body>
        <h1>${escapeHtml(shop?.name || "Labels")}</h1>
        <div class="sheet">${cells.join("")}</div>
      </body></html>`);
    } catch (e) {
      setSaid(e?.message || "Could not open the print window.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <Card>
        <T variant="h2">Barcode labels</T>
        <T variant="sub" style={{ marginTop: space(1) }}>
          Real Code 128 bars, not the number printed as text — a laser scanner reads these. Stick them on
          the shelf or the packet and billing becomes scan-and-done.
        </T>
        <Row style={{ marginTop: space(3), gap: space(3) }}>
          <Field
            label="How many of each"
            value={perItem}
            onChangeText={(v) => setPerItem(String(v).replace(/[^\d]/g, ""))}
            keyboardType="number-pad"
            style={{ width: 120 }}
          />
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <Button
              title={busy ? "Opening…" : `Print ${chosen.length || ""} ${chosen.length === 1 ? "label" : "labels"}`.trim()}
              kind="primary"
              full
              icon="print"
              busy={busy}
              disabled={busy || chosen.length === 0}
              onPress={print}
            />
          </View>
        </Row>
        {said ? (
          <Note tone="bad" style={{ marginTop: space(3) }}>
            {said}
          </Note>
        ) : null}
      </Card>

      <Row style={{ marginTop: space(4), gap: space(3) }}>
        <Button
          title="Select all"
          size="sm"
          onPress={() => setPicked(Object.fromEntries(printable.map((i) => [i.id, true])))}
        />
        <Button title="Clear" size="sm" onPress={() => setPicked({})} />
      </Row>

      <Card pad={false} style={{ marginTop: space(3) }}>
        {printable.map((item, i) => {
          const on = Boolean(picked[item.id]);
          return (
            <View key={item.id}>
              {i ? <Divider /> : null}
              <Pressable
                onPress={() => setPicked((p) => ({ ...p, [item.id]: !on }))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={item.name}
                style={({ pressed }) => [st.row, pressed && { backgroundColor: colors.sunken }]}
              >
                <View style={[st.box, on && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
                  {on ? <Icon name="check" size={14} color="#fff" /> : null}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T numberOfLines={1}>{item.name}</T>
                  <T variant="tiny">{item.code || `GAL${item.id}`}</T>
                </View>
                <T num variant="sub">
                  {rupees(item.salePaise)}
                </T>
              </Pressable>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

// ---------------------------------------------------------------------------
// BULK PRICE CHANGE
// ---------------------------------------------------------------------------
function Prices() {
  const { rows, state, reload } = useItems();
  const [category, setCategory] = useState("");
  const [picking, setPicking] = useState(false);
  const [percent, setPercent] = useState("");
  const [direction, setDirection] = useState("up");
  const [round, setRound] = useState(true);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState(null);

  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState error={state.error} />;

  const categories = [...new Set(rows.map((i) => (i.raw?.category || "")).filter(Boolean))];
  const affected = rows.filter((i) => (category ? (i.raw?.category || "") === category : true) && i.salePaise > 0);

  const pct = Number(percent) || 0;
  const factor = 1 + (direction === "up" ? pct : -pct) / 100;
  const newPrice = (paise) => {
    const raw = paise * factor;
    // Rounded to the rupee by default, because a shelf price of ₹53.47 is a
    // price nobody can pay in cash.
    return Math.max(0, round ? Math.round(raw / 100) * 100 : Math.round(raw));
  };

  async function apply() {
    setSaid(null);
    if (!pct) {
      setSaid({ tone: "bad", body: "By how much?" });
      return;
    }
    setBusy(true);
    let done = 0;
    const failed = [];
    try {
      // One at a time. The server has no bulk endpoint, and inventing one
      // here by firing two hundred requests at once is how a shop's phone
      // ends up with half the prices changed and no idea which half.
      for (const item of affected) {
        try {
          await setSalePrice(item.id, newPrice(item.salePaise) / 100);
          done++;
        } catch (e) {
          failed.push(item.name);
        }
      }
      await reload();
      setSaid({
        tone: failed.length ? "warn" : "good",
        body: failed.length
          ? `${done} changed. These did not: ${failed.slice(0, 5).join(", ")}${
              failed.length > 5 ? ` and ${failed.length - 5} more` : ""
            }.`
          : `${done} ${done === 1 ? "price" : "prices"} changed.`,
      });
      setPercent("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <Card>
        <T variant="h2">Change prices in bulk</T>
        <T variant="sub" style={{ marginTop: space(1) }}>
          Everything, or one category. Only the selling price moves — the purchase price and the tax rate
          stay as they are.
        </T>

        <PickerButton
          label="Which items"
          value={category || "Everything"}
          onPress={() => setPicking(true)}
          style={{ marginTop: space(4) }}
        />

        <Row style={{ marginTop: space(4), gap: space(3) }}>
          <Button
            title="Up"
            kind={direction === "up" ? "primary" : "default"}
            onPress={() => setDirection("up")}
            style={{ flex: 1 }}
          />
          <Button
            title="Down"
            kind={direction === "down" ? "primary" : "default"}
            onPress={() => setDirection("down")}
            style={{ flex: 1 }}
          />
        </Row>

        <Field
          label="By what percent"
          required
          value={percent}
          onChangeText={(v) => setPercent(String(v).replace(/[^\d.]/g, ""))}
          keyboardType="decimal-pad"
          placeholder="5"
          style={{ marginTop: space(4) }}
        />

        <Button
          title={round ? "Rounding to whole rupees" : "Keeping the paise"}
          icon={round ? "check" : "close"}
          kind={round ? "primary" : "default"}
          full
          style={{ marginTop: space(4) }}
          onPress={() => setRound((v) => !v)}
        />

        <Button
          title={busy ? `Changing…` : `Change ${affected.length} ${affected.length === 1 ? "price" : "prices"}`}
          kind="primary"
          size="lg"
          full
          busy={busy}
          disabled={busy || !pct}
          onPress={apply}
          style={{ marginTop: space(4) }}
        />

        {said ? (
          <Note tone={said.tone} style={{ marginTop: space(3) }}>
            {said.body}
          </Note>
        ) : null}
      </Card>

      {pct ? (
        <Card pad={false} style={{ marginTop: space(4) }}>
          <View style={{ padding: space(4), paddingBottom: space(2) }}>
            <T variant="label">What will change</T>
            <T variant="tiny">Check a few before you press the button.</T>
          </View>
          {affected.slice(0, 20).map((item, i) => (
            <View key={item.id}>
              {i ? <Divider /> : null}
              <Row style={st.row}>
                <T numberOfLines={1} style={{ flex: 1 }}>
                  {item.name}
                </T>
                <T num variant="sub" style={{ color: colors.ink3 }}>
                  {rupees(item.salePaise)}
                </T>
                <Icon name="chevron" size={14} color={colors.ink3} />
                <T num variant="sub" style={{ fontWeight: "700" }}>
                  {rupees(newPrice(item.salePaise))}
                </T>
              </Row>
            </View>
          ))}
          {affected.length > 20 ? (
            <T variant="tiny" style={{ padding: space(4), textAlign: "center" }}>
              {`and ${affected.length - 20} more`}
            </T>
          ) : null}
        </Card>
      ) : null}

      <Choose
        open={picking}
        onClose={() => setPicking(false)}
        title="Which items"
        options={[{ value: "", label: "Everything" }, ...categories.map((c) => ({ value: c, label: c }))]}
        value={category}
        onPick={setCategory}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// LOW STOCK
// ---------------------------------------------------------------------------
function LowStock() {
  const router = useRouter();
  const { rows, state } = useItems();

  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState error={state.error} />;

  const low = rows
    .filter((i) => i.type !== "service" && i.isLow || i.isOut)
    .sort((a, b) => a.stock - b.stock);
  const out = rows.filter((i) => i.type !== "service" && i.stock <= 0);
  const noLevel = rows.filter((i) => i.type !== "service" && i.lowStockAlert === null).length;

  return (
    <View>
      <Card>
        <T variant="h2">Items running out</T>
        <T variant="sub" style={{ marginTop: space(1) }}>
          {low.length === 0
            ? "Nothing is below its reorder level."
            : `${low.length} ${low.length === 1 ? "item is" : "items are"} at or below the level you set, ${
                out.length
              } already finished.`}
        </T>
        {noLevel > 0 ? (
          <Note tone="info" style={{ marginTop: space(3) }}>
            {`${noLevel} ${noLevel === 1 ? "item has" : "items have"} no reorder level set, so they can never appear here. Open an item and set "tell me when it falls below".`}
          </Note>
        ) : null}
      </Card>

      {low.length ? (
        <Card pad={false} style={{ marginTop: space(4) }}>
          {low.map((item, i) => (
            <View key={item.id}>
              {i ? <Divider /> : null}
              <Pressable
                onPress={() => router.push(`/items/${item.id}`)}
                style={({ pressed }) => [st.row, pressed && { backgroundColor: colors.sunken }]}
                accessibilityRole="button"
                accessibilityLabel={item.name}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T numberOfLines={1} style={{ fontWeight: "600" }}>
                    {item.name}
                  </T>
                  <T variant="tiny">{`reorder at ${formatQty(item.lowStockAlert)} ${item.unit || ""}`}</T>
                </View>
                <T num style={{ fontWeight: "700", color: item.stock <= 0 ? colors.danger : colors.warn }}>
                  {`${formatQty(item.stock)} ${item.unit || ""}`}
                </T>
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// EXPIRING
// ---------------------------------------------------------------------------
function Expiry() {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });

  useEffect(() => {
    (async () => {
      try {
        setRows(await expiringBatches({ days: 60 }));
        setState({ loading: false, error: null });
      } catch (e) {
        setState({ loading: false, error: e });
      }
    })();
  }, []);

  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState error={state.error} />;

  return (
    <View>
      <Card>
        <T variant="h2">Expiring in the next two months</T>
        <T variant="sub" style={{ marginTop: space(1) }}>
          {rows.length === 0
            ? "Nothing is close to its date. This only covers items where you record batches."
            : "Sell these first, or return them while the supplier will still take them."}
        </T>
      </Card>

      {rows.length ? (
        <Card pad={false} style={{ marginTop: space(4) }}>
          {rows.map((b, i) => (
            <View key={b.id}>
              {i ? <Divider /> : null}
              <Row style={st.row}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T numberOfLines={1} style={{ fontWeight: "600" }}>
                    {b.itemName || b.batchNo}
                  </T>
                  <T variant="tiny">{`batch ${b.batchNo || "—"} · ${formatQty(b.quantity)} left`}</T>
                </View>
                <T num variant="sub" style={{ color: colors.warn, fontWeight: "700" }}>
                  {formatDate(b.expiryDate)}
                </T>
              </Row>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// PRICE LIST
// ---------------------------------------------------------------------------
function PriceList() {
  const { shop } = useSession();
  const { rows, state } = useItems();
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState("");

  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState error={state.error} />;

  const sorted = [...rows].sort((a, b) => (a.category || "").localeCompare(b.category || "") || a.name.localeCompare(b.name));

  async function print() {
    setSaid("");
    setBusy(true);
    try {
      let html = "";
      let last = null;
      for (const i of sorted) {
        if (((i.raw?.category || "") || "") !== last) {
          last = (i.raw?.category || "") || "";
          html += `<tr class="cat"><td colspan="3">${escapeHtml(last || "Everything else")}</td></tr>`;
        }
        html += `<tr><td>${escapeHtml(i.name)}</td><td class="u">${escapeHtml(i.unit || "")}</td><td class="p">${rupees(
          i.salePaise
        )}</td></tr>`;
      }

      await printHtml(`<!doctype html><html><head><meta charset="utf-8"><style>
        @page { margin: 12mm; }
        body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; font-size: 10pt; }
        h1 { font-size: 15pt; margin: 0; }
        .sub { color: #667; font-size: 9pt; margin: 1mm 0 5mm; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 1.6mm 2mm; border-bottom: 0.2mm solid #eee; }
        .cat td { background: #f3f5f7; font-weight: 700; font-size: 9pt; border-bottom: none; }
        .u { color: #778; width: 18mm; }
        .p { text-align: right; font-weight: 700; width: 28mm; }
      </style></head><body>
        <h1>${escapeHtml(shop?.name || "Price list")}</h1>
        <div class="sub">${sorted.length} items · ${new Date().toLocaleDateString("en-IN")}${
        shop?.phone ? ` · ${escapeHtml(shop.phone)}` : ""
      }</div>
        <table>${html}</table>
      </body></html>`);
    } catch (e) {
      setSaid(e?.message || "Could not open the print window.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <Card>
        <T variant="h2">Your items as a price list</T>
        <T variant="sub" style={{ marginTop: space(1) }}>
          {`${sorted.length} items, grouped by category. Print it for the counter, or save it as a PDF and send it on WhatsApp.`}
        </T>
        <Button
          title={busy ? "Opening…" : "Print or save as PDF"}
          kind="primary"
          full
          icon="print"
          busy={busy}
          disabled={busy || sorted.length === 0}
          onPress={print}
          style={{ marginTop: space(4) }}
        />
        {said ? (
          <Note tone="bad" style={{ marginTop: space(3) }}>
            {said}
          </Note>
        ) : null}
        {Platform.OS === "web" ? (
          <T variant="tiny" style={{ marginTop: space(2) }}>
            In the print window, choose &quot;Save as PDF&quot; as the printer.
          </T>
        ) : null}
      </Card>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CHECK MY DATA
// ---------------------------------------------------------------------------
// The mistakes that do not announce themselves: an item with no price that
// bills as zero, a GSTIN that will be rejected when the return is filed, a
// bill nobody has chased for three months.
function Verify() {
  const router = useRouter();
  const [found, setFound] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });

  useEffect(() => {
    (async () => {
      try {
        const [items, parties, bills] = await Promise.all([listAllItems(), listAllParties(), listAllInvoices()]);
        const today = new Date();
        const old = (d) => (today - new Date(d)) / 86400000;

        setFound({
          noPrice: items.rows.filter((i) => !i.salePaise),
          negative: items.rows.filter((i) => i.type !== "service" && i.stock < 0),
          noCode: items.rows.filter((i) => i.type !== "service" && !i.code),
          badGstin: parties.rows.filter((p) => p.gstin && !isValidGstin(p.gstin)),
          noPhone: parties.rows.filter((p) => !p.phone),
          stale: bills.rows.filter(
            (b) => b.amounts.balance > 0 && b.status !== "cancelled" && old(b.date) > 60
          ),
        });
        setState({ loading: false, error: null });
      } catch (e) {
        setState({ loading: false, error: e });
      }
    })();
  }, []);

  if (state.loading) return <Loading label="Checking" />;
  if (state.error) return <ErrorState error={state.error} />;

  const checks = [
    {
      rows: found.noPrice,
      title: "Items with no selling price",
      why: "These bill as zero. A busy counter will not notice until the day's total is short.",
      href: "/items",
      tone: "bad",
    },
    {
      rows: found.negative,
      title: "Items with less than no stock",
      why: "Something was sold that was never recorded as coming in. Fix the count on each one.",
      href: "/items",
      tone: "bad",
    },
    {
      rows: found.badGstin,
      title: "Customers with a GSTIN that is not valid",
      why: "A GSTIN has a check digit. These will be rejected when you file, and the bill is already printed.",
      href: "/parties",
      tone: "bad",
    },
    {
      rows: found.stale,
      title: "Bills unpaid for more than two months",
      why: "The longer one sits, the less likely it is to be paid. Send a reminder.",
      href: "/bills?filter=unpaid",
      tone: "warn",
    },
    {
      rows: found.noPhone,
      title: "Customers with no phone number",
      why: "No number means no reminder and no bill on WhatsApp.",
      href: "/parties",
      tone: "info",
    },
    {
      rows: found.noCode,
      title: "Items with no barcode or code",
      why: "They can only be found by typing the name. A code makes them scannable.",
      href: "/items",
      tone: "info",
    },
  ];

  const problems = checks.filter((c) => c.rows.length > 0);

  return (
    <View>
      <Card>
        <T variant="h2">Check my data</T>
        <T variant="sub" style={{ marginTop: space(1) }}>
          {problems.length === 0
            ? "Nothing looks wrong. Worth running again after a busy month."
            : `${problems.length} ${problems.length === 1 ? "thing" : "things"} worth a look.`}
        </T>
      </Card>

      {problems.map((c) => (
        <Card key={c.title} style={{ marginTop: space(4) }}>
          <Row gap={2}>
            <Icon
              name={c.tone === "bad" ? "warn" : c.tone === "warn" ? "warn" : "info"}
              size={18}
              color={c.tone === "bad" ? colors.danger : c.tone === "warn" ? colors.warn : colors.ink2}
            />
            <T style={{ flex: 1, fontWeight: "700" }}>{`${c.rows.length} ${c.title.toLowerCase()}`}</T>
          </Row>
          <T variant="tiny" style={{ marginTop: space(2) }}>
            {c.why}
          </T>
          <T variant="tiny" style={{ marginTop: space(2), color: colors.ink3 }}>
            {c.rows
              .slice(0, 6)
              .map((r) => r.name || r.number || `#${r.id}`)
              .join(", ")}
            {c.rows.length > 6 ? ` and ${c.rows.length - 6} more` : ""}
          </T>
          <Button
            title="Go and fix it"
            kind="ghost"
            size="sm"
            onPress={() => router.push(c.href)}
            style={{ marginTop: space(2), alignSelf: "flex-start" }}
          />
        </Card>
      ))}
    </View>
  );
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
});
