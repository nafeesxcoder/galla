// ===========================================================================
// ONE ITEM
// ---------------------------------------------------------------------------
// The stock figure is the headline, because that is what gets looked up and
// that is what gets corrected. Everything else - price, GST, code - is detail
// that changes once a year.
//
// Three things can be done here:
//
//   fix the stock   when the shelf and the app disagree, which they will
//   see the history every change with a reason, so "where did ten bags go"
//                   has an answer rather than an argument
//   batches         only for items that track them. A chemist needs batch and
//                   expiry on the bill by law; a hardware shop does not, and
//                   making everyone carry it would be a tax on the shops that
//                   do not.
// ===========================================================================

import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  CardHead,
  Divider,
  ErrorState,
  Field,
  Loading,
  MoneyField,
  Note,
  Pill,
  Row,
  Screen,
  T,
} from "../../components/ui";
import { Choose, PickerButton, Sheet } from "../../components/sheet";
import { Icon } from "../../components/icons";
import {
  adjustStock,
  createBatch,
  getItem,
  listBatches,
  listStockMoves,
  updateItem,
} from "../../lib/data";
import { ageInDays, formatDate, formatQty, rupees } from "../../lib/money";
import { UNITS, unitLabel, unitShort } from "../../lib/units";
import { TAX_RATES } from "../../lib/gst-calc";
import { colors, space } from "../../lib/theme";

// The server takes five words. The screen offers more, because "lost" and
// "given away free" are different things to a shopkeeper even when the stock
// moves the same way - the extra ones are folded into the note so the real
// reason stays readable in the history.
const REASONS = [
  { value: "correction", label: "Counting correction", note: "The shelf and the app disagree" },
  { value: "damage", label: "Damaged", note: "Broken, spoiled, unsellable" },
  { value: "expired", label: "Expired" },
  { value: "lost", label: "Lost or stolen" },
  { value: "sample", label: "Given free", note: "Sample, gift, staff use" },
  { value: "return_in", label: "Came back from a customer" },
  { value: "return_out", label: "Sent back to a supplier" },
  { value: "other", label: "Something else" },
];

const MOVE_WORDS = {
  sale: "Sold",
  purchase: "Bought in",
  opening: "Opening stock",
  adjustment: "Adjusted",
  damage: "Damaged",
  expiry: "Expired",
  return_in: "Returned by a customer",
  return_out: "Returned to a supplier",
  cancel: "Bill cancelled",
};

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [item, setItem] = useState(null);
  const [moves, setMoves] = useState([]);
  const [batches, setBatches] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [sheet, setSheet] = useState(null); // adjust | edit | batch | history

  const load = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      const it = await getItem(id);
      setItem(it);
      setState({ loading: false, error: null });

      listStockMoves(id, { limit: 50 }).then(setMoves).catch(() => setMoves([]));
      if (it?.trackBatches) listBatches(id).then(setBatches).catch(() => setBatches([]));
      else setBatches([]);
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;
  if (state.loading || !item) return <Loading label="Opening the item…" />;

  const isService = item.type === "service";

  return (
    <Screen>
      <Stack.Screen options={{ title: item.name }} />

      {/* ---- the stock ---- */}
      <Card>
        <Row style={{ alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <T variant="h2">{item.name}</T>
            <T variant="tiny">
              {item.code ? `${item.code} · ` : ""}
              {item.hsn ? `HSN ${item.hsn} · ` : ""}
              {item.taxRate ? `${item.taxRate}% GST` : "No GST"}
              {item.taxIncluded ? " (included in the price)" : ""}
            </T>
          </View>
          {isService ? <Pill tone="info">Service</Pill> : null}
        </Row>

        {!isService ? (
          <View style={{ marginTop: space(4) }}>
            <T variant="tiny">In stock</T>
            <T
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: item.isOut ? colors.danger : item.isLow ? colors.warn : colors.ink,
              }}
              num
            >
              {`${formatQty(item.stock)} ${unitShort(item.unit)}`}
            </T>
            {item.isOut ? (
              <T variant="tiny" style={{ color: colors.danger }}>
                Finished. It can still be billed, but the count will go negative.
              </T>
            ) : item.isLow ? (
              <T variant="tiny" style={{ color: colors.warn }}>
                {`Below your warning level of ${formatQty(item.lowStockAlert)} ${unitShort(item.unit)}.`}
              </T>
            ) : null}
          </View>
        ) : null}

        <Row gap={4} style={{ marginTop: space(4) }}>
          <View>
            <T variant="tiny">You sell at</T>
            <T style={{ fontSize: 17, fontWeight: "700" }} num>
              {rupees(item.salePaise)}
            </T>
          </View>
          {item.costPaise ? (
            <View>
              <T variant="tiny">You buy at</T>
              <T style={{ fontSize: 17, fontWeight: "700" }} num>
                {rupees(item.costPaise)}
              </T>
            </View>
          ) : null}
          {item.costPaise && item.salePaise > item.costPaise ? (
            <View>
              <T variant="tiny">Margin</T>
              <T style={{ fontSize: 17, fontWeight: "700", color: colors.brandInk }} num>
                {`${Math.round(((item.salePaise - item.costPaise) / item.costPaise) * 100)}%`}
              </T>
            </View>
          ) : null}
        </Row>
      </Card>

      {/* ---- what you came to do ---- */}
      <View style={{ marginTop: space(4), gap: space(2) }}>
        {!isService ? (
          <Button
            title="Fix the stock"
            kind="primary"
            size="lg"
            full
            icon={<Icon name="refresh" size={18} color="#fff" />}
            onPress={() => setSheet("adjust")}
          />
        ) : null}
        <Row gap={2}>
          <Button
            title="Edit"
            style={{ flex: 1 }}
            icon={<Icon name="edit" size={16} />}
            onPress={() => setSheet("edit")}
          />
          <Button
            title="Sell it"
            style={{ flex: 1 }}
            icon={<Icon name="bill" size={16} />}
            onPress={() => router.push("/(tabs)/billing")}
          />
        </Row>
      </View>

      {/* ---- batches ---- */}
      {item.trackBatches ? (
        <Card style={{ marginTop: space(5) }} pad={false}>
          <View style={{ padding: space(4), paddingBottom: batches.length ? space(2) : space(4) }}>
            <CardHead
              title="Batches"
              right={<Button title="Add" kind="ghost" size="sm" onPress={() => setSheet("batch")} />}
            />
            <T variant="tiny" style={{ marginTop: -space(2) }}>
              The one expiring soonest is sold first, automatically.
            </T>
          </View>

          {batches.length ? (
            batches.map((b, i) => (
              <View key={b.id}>
                {i ? <Divider /> : null}
                <Row style={{ paddingHorizontal: space(4), paddingVertical: space(3) }}>
                  <View style={{ flex: 1 }}>
                    <T style={{ fontWeight: "650" }}>{b.batchNo}</T>
                    <T variant="tiny">
                      {b.expiryDate ? `Expires ${formatDate(b.expiryDate)}` : "No expiry recorded"}
                      {b.mrpPaise ? ` · MRP ${rupees(b.mrpPaise)}` : ""}
                    </T>
                  </View>
                  {b.expired ? (
                    <Pill tone="unpaid">Expired</Pill>
                  ) : b.expiryDate && ageInDays(b.expiryDate) > -30 ? (
                    <Pill tone="partial">Soon</Pill>
                  ) : null}
                  <T style={{ fontWeight: "700" }} num>
                    {`${formatQty(b.quantity)} ${unitShort(item.unit)}`}
                  </T>
                </Row>
              </View>
            ))
          ) : (
            <View style={{ paddingHorizontal: space(4), paddingBottom: space(4) }}>
              <T variant="sub">No batches yet. Add one when the next delivery arrives.</T>
            </View>
          )}
        </Card>
      ) : null}

      {/* ---- the history ---- */}
      {!isService ? (
        <Card style={{ marginTop: space(5) }} pad={false}>
          <View style={{ padding: space(4), paddingBottom: space(2) }}>
            <CardHead title="Every change" />
          </View>
          {moves.length ? (
            moves.slice(0, 20).map((m, i) => (
              <View key={m.id || i}>
                {i ? <Divider /> : null}
                <Row style={{ paddingHorizontal: space(4), paddingVertical: space(3) }}>
                  <View style={{ flex: 1 }}>
                    <T style={{ fontWeight: "600" }}>{MOVE_WORDS[m.reason] || m.reason || "Changed"}</T>
                    <T variant="tiny">
                      {m.createdAt ? formatDate(String(m.createdAt).slice(0, 10)) : ""}
                      {m.notes ? ` · ${m.notes}` : ""}
                    </T>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <T
                      style={{ fontWeight: "700", color: m.change < 0 ? colors.danger : colors.brandInk }}
                      num
                    >
                      {`${m.change > 0 ? "+" : ""}${formatQty(m.change)}`}
                    </T>
                    <T variant="tiny" num>
                      {`${formatQty(m.balanceAfter)} left`}
                    </T>
                  </View>
                </Row>
              </View>
            ))
          ) : (
            <View style={{ paddingHorizontal: space(4), paddingBottom: space(4) }}>
              <T variant="sub">Nothing has moved yet.</T>
            </View>
          )}
        </Card>
      ) : null}

      <AdjustSheet
        open={sheet === "adjust"}
        item={item}
        onClose={() => setSheet(null)}
        onDone={async () => {
          setSheet(null);
          await load();
        }}
      />

      <EditSheet
        open={sheet === "edit"}
        item={item}
        onClose={() => setSheet(null)}
        onDone={async () => {
          setSheet(null);
          await load();
        }}
      />

      <BatchSheet
        open={sheet === "batch"}
        item={item}
        onClose={() => setSheet(null)}
        onDone={async () => {
          setSheet(null);
          await load();
        }}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// fixing the stock
// ---------------------------------------------------------------------------
// Asking for the real count rather than the difference. "There are 18 on the
// shelf" is a thing a person can see; "it is 7 less than the app thinks" is
// arithmetic they should not have to do standing in front of the shelf.
function AdjustSheet({ open, item, onClose, onDone }) {
  const [mode, setMode] = useState("count");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("correction");
  const [notes, setNotes] = useState("");
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setMode("count");
      setValue("");
      setReason("correction");
      setNotes("");
      setErr(null);
    }
  }, [open]);

  const typed = Number(value);
  const valid = value !== "" && Number.isFinite(typed);
  const change = !valid ? 0 : mode === "count" ? +(typed - item.stock).toFixed(3) : typed;
  const after = +(item.stock + change).toFixed(3);

  async function save() {
    setErr(null);
    if (!valid) return setErr("Enter a number.");
    if (!change) return setErr("That is what the app already says — nothing to change.");
    if (after < 0) return setErr("That would take the stock below zero.");

    setBusy(true);
    try {
      await adjustStock(item.id, { quantity: change, reason, notes: notes.trim() || undefined });
      onDone();
    } catch (e) {
      setErr(e.isOffline ? "Could not reach the server. Nothing was changed." : e.message);
    } finally {
      setBusy(false);
    }
  }

  const unit = unitShort(item.unit);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Fix the stock"
      subtitle={`${item.name} · app says ${formatQty(item.stock)} ${unit}`}
      footer={<Button title="Save the change" kind="primary" size="lg" full busy={busy} onPress={save} />}
    >
      {err ? <Note tone="bad" style={{ marginBottom: space(4) }}>{err}</Note> : null}

      <Card>
        <Row gap={2} style={{ marginBottom: space(4) }}>
          <Button
            title="Count on the shelf"
            size="sm"
            kind={mode === "count" ? "primary" : "default"}
            onPress={() => {
              setMode("count");
              setValue("");
            }}
          />
          <Button
            title="Add or remove"
            size="sm"
            kind={mode === "delta" ? "primary" : "default"}
            onPress={() => {
              setMode("delta");
              setValue("");
            }}
          />
        </Row>

        <Field
          label={mode === "count" ? "How many are actually there" : "How many to add (or minus to remove)"}
          required
          value={value}
          onChangeText={(v) => setValue(v.replace(/[^\d.-]/g, ""))}
          keyboardType={mode === "count" ? "decimal-pad" : "numbers-and-punctuation"}
          inputMode="decimal"
          placeholder={mode === "count" ? String(item.stock) : "-5"}
          hint={unit}
          autoFocus
        />

        <PickerButton
          label="Why"
          required
          style={{ marginTop: space(4) }}
          value={REASONS.find((r) => r.value === reason)?.label}
          onPress={() => setPicking(true)}
          hint="This is what the history will say six months from now."
        />

        <Field
          label="Note"
          style={{ marginTop: space(4) }}
          value={notes}
          onChangeText={setNotes}
          placeholder="Two bags torn in the delivery"
          maxLength={200}
        />
      </Card>

      {valid && change ? (
        <Note tone={change < 0 ? "warn" : "good"} style={{ marginTop: space(4) }}>
          {`${formatQty(item.stock)} ${unit} → ${formatQty(after)} ${unit}  (${change > 0 ? "+" : ""}${formatQty(
            change
          )})`}
        </Note>
      ) : null}

      <Choose
        open={picking}
        onClose={() => setPicking(false)}
        title="Why is it changing?"
        value={reason}
        options={REASONS}
        onPick={setReason}
      />
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// editing the item itself
// ---------------------------------------------------------------------------
function EditSheet({ open, item, onClose, onDone }) {
  const [form, setForm] = useState(() => formFrom(item));
  const [picking, setPicking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(formFrom(item));
      setErr(null);
    }
  }, [open, item]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const isService = form.type === "service";

  async function save() {
    setErr(null);
    if (!form.name.trim()) return setErr("The item needs a name.");
    if (form.salePrice === "") return setErr("Enter what you sell it for.");
    setBusy(true);
    try {
      await updateItem(item.id, form);
      onDone();
    } catch (e) {
      setErr(e.isOffline ? "Could not reach the server." : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit the item"
      subtitle="Bills already made are not touched"
      footer={<Button title="Save" kind="primary" size="lg" full busy={busy} onPress={save} />}
    >
      {err ? <Note tone="bad" style={{ marginBottom: space(4) }}>{err}</Note> : null}

      <Card>
        <Field label="Item name" required value={form.name} onChangeText={set("name")} maxLength={160} />

        <Row gap={3} style={{ marginTop: space(4), alignItems: "flex-start" }}>
          <MoneyField
            label="Sale price"
            required
            style={{ flex: 1 }}
            value={form.salePrice}
            onChangeText={(v) => set("salePrice")(v.replace(/[^\d.]/g, ""))}
          />
          <MoneyField
            label="Cost price"
            style={{ flex: 1 }}
            value={form.purchasePrice}
            onChangeText={(v) => set("purchasePrice")(v.replace(/[^\d.]/g, ""))}
          />
        </Row>

        <Row gap={3} style={{ marginTop: space(4), alignItems: "flex-start" }}>
          <PickerButton label="GST" style={{ flex: 1 }} value={`${form.taxRate}%`} onPress={() => setPicking("tax")} />
          <PickerButton
            label="Sold by"
            style={{ flex: 1 }}
            value={unitLabel(form.unit)}
            onPress={() => setPicking("unit")}
          />
        </Row>

        <PickerButton
          label="Price already includes GST"
          style={{ marginTop: space(4) }}
          value={form.taxIncluded ? "Yes, it is an MRP" : "No, GST is added on top"}
          onPress={() => setPicking("incl")}
        />

        {!isService ? (
          <Field
            label="Warn me when stock falls to"
            style={{ marginTop: space(4) }}
            value={form.lowStockAlert}
            onChangeText={(v) => set("lowStockAlert")(v.replace(/[^\d.]/g, ""))}
            keyboardType="decimal-pad"
            inputMode="decimal"
            placeholder="0"
            hint="Leave blank for no warning. Stock itself is changed with “Fix the stock”."
          />
        ) : null}

        <Row gap={3} style={{ marginTop: space(4), alignItems: "flex-start" }}>
          <Field
            label="Code or barcode"
            style={{ flex: 1 }}
            value={form.code}
            onChangeText={set("code")}
            autoCapitalize="characters"
          />
          <Field
            label="HSN or SAC"
            style={{ flex: 1 }}
            value={form.hsn}
            onChangeText={(v) => set("hsn")(v.replace(/\D+/g, ""))}
            keyboardType="number-pad"
            maxLength={8}
          />
        </Row>

        <PickerButton
          label="Keep batch and expiry"
          style={{ marginTop: space(4) }}
          value={form.trackBatches ? "Yes" : "No"}
          onPress={() => setPicking("batch")}
          hint={item.trackBatches ? "Turning this off hides existing batches, it does not delete them." : undefined}
        />
      </Card>

      <Choose
        open={picking === "tax"}
        onClose={() => setPicking(null)}
        title="GST rate"
        value={String(form.taxRate)}
        options={TAX_RATES.map((t) => ({ value: String(t.value), label: t.label }))}
        onPick={(v) => set("taxRate")(Number(v))}
      />
      <Choose
        open={picking === "unit"}
        onClose={() => setPicking(null)}
        title="Sold by"
        value={form.unit}
        options={UNITS.map((u) => ({ value: u.code, label: u.label, note: u.code }))}
        onPick={set("unit")}
      />
      <Choose
        open={picking === "incl"}
        onClose={() => setPicking(null)}
        title="Does the price include GST?"
        value={form.taxIncluded ? "1" : "0"}
        options={[
          { value: "0", label: "No, GST is added on top" },
          { value: "1", label: "Yes, it is an MRP" },
        ]}
        onPick={(v) => set("taxIncluded")(v === "1")}
      />
      <Choose
        open={picking === "batch"}
        onClose={() => setPicking(null)}
        title="Keep batch and expiry"
        value={form.trackBatches ? "1" : "0"}
        options={[
          { value: "0", label: "No" },
          { value: "1", label: "Yes", note: "Medicines, food, anything dated" },
        ]}
        onPick={(v) => set("trackBatches")(v === "1")}
      />
    </Sheet>
  );
}

function formFrom(item) {
  return {
    name: item.name,
    type: item.type,
    unit: item.unit,
    salePrice: item.salePaise ? String(item.salePaise / 100) : "",
    purchasePrice: item.costPaise ? String(item.costPaise / 100) : "",
    taxRate: item.taxRate,
    taxIncluded: item.taxIncluded,
    trackBatches: item.trackBatches,
    lowStockAlert: item.lowStockAlert == null ? "" : String(item.lowStockAlert),
    code: item.code,
    hsn: item.hsn,
    description: item.description,
  };
}

// ---------------------------------------------------------------------------
// a new batch
// ---------------------------------------------------------------------------
// The quantity here is stock arriving, so it goes in through the ordinary
// stock route rather than being written straight onto the item. That is what
// keeps the batch quantities and the item's own count from ever drifting
// apart.
function BatchSheet({ open, item, onClose, onDone }) {
  const [form, setForm] = useState(blankBatch);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(blankBatch());
      setErr(null);
    }
  }, [open]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const dateOk = !form.expiryDate || /^\d{4}-\d{2}-\d{2}$/.test(form.expiryDate);

  async function save() {
    setErr(null);
    if (!form.batchNo.trim()) return setErr("Every batch needs its number — it goes on the bill.");
    if (!dateOk) return setErr("The expiry date needs to look like 2027-04-30.");
    setBusy(true);
    try {
      await createBatch(item.id, form);
      onDone();
    } catch (e) {
      setErr(e.isOffline ? "Could not reach the server." : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New batch"
      subtitle={item.name}
      footer={<Button title="Add the batch" kind="primary" size="lg" full busy={busy} onPress={save} />}
    >
      {err ? <Note tone="bad" style={{ marginBottom: space(4) }}>{err}</Note> : null}

      <Card>
        <Field
          label="Batch number"
          required
          value={form.batchNo}
          onChangeText={set("batchNo")}
          placeholder="B2291"
          autoCapitalize="characters"
          autoFocus
          hint="Printed on the box. It goes on the customer's bill."
        />

        <Row gap={3} style={{ marginTop: space(4), alignItems: "flex-start" }}>
          <Field
            label="How many arrived"
            style={{ flex: 1 }}
            value={form.quantity}
            onChangeText={(v) => set("quantity")(v.replace(/[^\d.]/g, ""))}
            keyboardType="decimal-pad"
            inputMode="decimal"
            placeholder="0"
            hint={unitShort(item.unit)}
          />
          <Field
            label="Expires on"
            style={{ flex: 1 }}
            value={form.expiryDate}
            onChangeText={(v) => set("expiryDate")(v.replace(/[^\d-]/g, "").slice(0, 10))}
            placeholder="2027-04-30"
            keyboardType="numbers-and-punctuation"
            hint="Year, month, day"
          />
        </Row>

        <Row gap={3} style={{ marginTop: space(4), alignItems: "flex-start" }}>
          <MoneyField
            label="MRP"
            style={{ flex: 1 }}
            value={form.mrp}
            onChangeText={(v) => set("mrp")(v.replace(/[^\d.]/g, ""))}
          />
          <MoneyField
            label="Cost"
            style={{ flex: 1 }}
            value={form.purchasePrice}
            onChangeText={(v) => set("purchasePrice")(v.replace(/[^\d.]/g, ""))}
          />
        </Row>
      </Card>

      <Note tone="info" style={{ marginTop: space(4) }}>
        Whatever you put in “how many arrived” is added to this item's stock, with the batch named — so the two
        counts can never drift apart. When you sell, the batch expiring soonest goes out first.
      </Note>
    </Sheet>
  );
}

function blankBatch() {
  return { batchNo: "", quantity: "", expiryDate: "", mrp: "", purchasePrice: "", salePrice: "" };
}
