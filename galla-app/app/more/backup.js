// ===========================================================================
// BACKUP
// ---------------------------------------------------------------------------
// A shopkeeper who cannot get their data out does not own it. This is the
// answer to "what if you shut down" and it is not a courtesy - without it the
// app is a place their books are held hostage.
//
// The file is plain JSON of the same shape the app's own screens receive:
// readable by a person, openable by a spreadsheet after a conversion, and not
// a database dump full of internal column names.
//
// RESTORE IS NOT HERE, on purpose. Writing a backup back over a live shop is
// the most destructive thing this app could do, and getting it half right -
// a duplicated year of sales, a partial import - leaves no way back. A
// restore worth having asks what it is about to overwrite and is confirmed
// line by line. Until that exists, promising it with a button would be worse
// than not having it.
// ===========================================================================

import { useCallback, useState } from "react";
import { Platform, View } from "react-native";
import { Button, Card, Field, Loading, Note, Row, Screen, T } from "../../components/ui";
import { Icon } from "../../components/icons";
import { useSession } from "../../lib/session";
import { fetchBackup } from "../../lib/data";
import { saveTextFile, stampedName } from "../../lib/save-file";
import { colors, space } from "../../lib/theme";

export default function Backup() {
  const { shop } = useSession();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState(null);
  const [last, setLast] = useState(null);

  const take = useCallback(async () => {
    setSaid(null);
    setBusy(true);
    try {
      const params = {};
      if (from.trim()) params.from = from.trim();
      if (to.trim()) params.to = to.trim();

      const data = await fetchBackup(params);
      const text = JSON.stringify(data, null, 2);
      const name = stampedName(
        `galla-${(shop?.name || "shop").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`
      );

      const counts = {
        items: data.items?.length ?? 0,
        parties: data.parties?.length ?? 0,
        bills: data.bills?.length ?? 0,
        payments: data.payments?.length ?? 0,
        expenses: data.expenses?.length ?? 0,
      };
      setLast({ ...counts, kb: Math.max(1, Math.round(text.length / 1024)), name });

      const result = await saveTextFile(name, text);
      if (result.ok) {
        setSaid({
          tone: "good",
          title: result.how === "download" ? "Downloaded" : "Ready to share",
          body:
            result.how === "download"
              ? `Saved as ${name}. Keep it somewhere that is not this phone — email it to yourself, or put it in Drive.`
              : "Pick where to put it. Email it to yourself or save it to Drive — somewhere that is not this phone.",
        });
      } else {
        setSaid({ tone: "bad", title: "Could not save the file", body: result.error });
      }
    } catch (e) {
      setSaid({ tone: "bad", title: "Could not take the backup", body: e?.message || "Try again." });
    } finally {
      setBusy(false);
    }
  }, [from, to, shop]);

  return (
    <Screen>
      <Card>
        <Row>
          <Icon name="cloud" size={22} color={colors.brandInk} />
          <T variant="h2" style={{ flex: 1 }}>
            Take a copy of everything
          </T>
        </Row>
        <T variant="sub" style={{ marginTop: space(2) }}>
          Your shop details, every item, every customer, every bill and its lines, payments, expenses,
          bank accounts and loans — in one file.
        </T>

        <Button
          title={busy ? "Putting it together…" : "Take a backup now"}
          kind="primary"
          size="lg"
          full
          icon="download"
          busy={busy}
          disabled={busy}
          onPress={take}
          style={{ marginTop: space(4) }}
        />
      </Card>

      {said ? (
        <Note tone={said.tone} title={said.title} style={{ marginTop: space(4) }}>
          {said.body}
        </Note>
      ) : null}

      {last ? (
        <Card style={{ marginTop: space(4) }}>
          <T variant="label" style={{ marginBottom: space(2) }}>
            What went in it
          </T>
          <Count label="Items" n={last.items} />
          <Count label="Customers and suppliers" n={last.parties} />
          <Count label="Bills" n={last.bills} />
          <Count label="Payments" n={last.payments} />
          <Count label="Expenses" n={last.expenses} />
          <T variant="tiny" style={{ marginTop: space(2) }}>
            {`${last.name} · about ${last.kb} KB`}
          </T>
        </Card>
      ) : null}

      <Card style={{ marginTop: space(5) }}>
        <T variant="label" style={{ marginBottom: space(2) }}>
          Only part of it
        </T>
        <T variant="sub">
          Leave these blank for everything. Fill them in when an accountant asks for one quarter.
        </T>
        <Row style={{ marginTop: space(3), gap: space(3) }}>
          <Field
            label="From"
            value={from}
            onChangeText={setFrom}
            placeholder="2026-04-01"
            style={{ flex: 1 }}
          />
          <Field label="To" value={to} onChangeText={setTo} placeholder="2026-06-30" style={{ flex: 1 }} />
        </Row>
        <T variant="tiny" style={{ marginTop: space(2) }}>
          Items, customers and bank accounts always come in full — a quarter's bills are no use without
          the people and things they refer to.
        </T>
      </Card>

      <Note tone="info" style={{ marginTop: space(5) }} title="Putting it back">
        Restoring is not here yet, and that is deliberate — a half-finished restore over a live shop
        cannot be undone. The file is a complete, readable record you can open or hand to an accountant,
        and when restore does arrive it will read exactly this file.
      </Note>

      <Note tone="warn" style={{ marginTop: space(3) }} title="Treat it like the cash box">
        This file has every customer's phone number and every price you charge. Do not leave it in a
        shared folder or a WhatsApp group.
      </Note>

      {Platform.OS !== "web" ? (
        <T variant="tiny" style={{ marginTop: space(4), textAlign: "center" }}>
          The file is written to the app's own storage and then handed to the share sheet, so the phone
          does not keep a second copy lying about.
        </T>
      ) : null}
    </Screen>
  );
}

function Count({ label, n }) {
  return (
    <Row style={{ paddingVertical: space(1) }}>
      <T variant="sub" style={{ flex: 1 }}>
        {label}
      </T>
      <T num variant="sub" style={{ fontWeight: "600" }}>
        {n}
      </T>
    </Row>
  );
}
