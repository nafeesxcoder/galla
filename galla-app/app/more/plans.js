// ===========================================================================
// MY ACCOUNT
// ---------------------------------------------------------------------------
// What this shop is on, how long it has left, the licence keys on the
// account, and how to get another. The same ground Vyapar's account panel
// covers: "Already have a License?", an offline payment route, several
// licences on one account, and a plain count of how many are active.
//
// The prices come from the server, not from a list typed into the app - a
// price written into the app is wrong on every phone that has not updated,
// and the one thing a shopkeeper will not forgive is being shown one number
// and charged another.
//
// There is no "pay now" yet because there is no payment gateway yet. A
// button that opens nothing is worse than a line saying who to call.
// ===========================================================================

import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Button, Card, Divider, ErrorState, Field, Loading, Note, Pill, Row, Screen, T } from "../../components/ui";
import { Icon } from "../../components/icons";
import { useSession } from "../../lib/session";
import { listPlans, myAccount, redeemLicence } from "../../lib/data";
import { SUPPORT, mailto, openUrl, whatsappTo } from "../../lib/support";
import { rupees } from "../../lib/money";
import { colors, space } from "../../lib/theme";

/** "12 October 2027", because 12/10/27 is read two ways in two countries. */
function longDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * The cheapest one-year price for a plan, or null if it has none.
 *
 * null rather than 0, because a screen renders 0 as "₹0" quite happily and
 * a free plan and a plan whose prices have not been set look identical that
 * way - right up until somebody tries to buy the second one.
 */
function cheapestYear(plan) {
  const year = (plan.prices || []).filter((r) => r.months === 12 && r.pricePaise > 0);
  if (year.length === 0) return null;
  return Math.min(...year.map((r) => r.pricePaise));
}

/** How long is left, said the way a person would say it. */
function remaining(days) {
  if (days === null) return "No end date";
  if (days < 0) return "Expired";
  if (days === 0) return "Ends today";
  if (days === 1) return "1 day left";
  if (days < 60) return `${days} days left`;
  const months = Math.round(days / 30);
  return `about ${months} months left`;
}

export default function Plans() {
  const { businessId } = useSession();
  const [rows, setRows] = useState([]);
  const [account, setAccount] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });
  const [said, setSaid] = useState("");

  const [key, setKey] = useState("");
  const [applying, setApplying] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [applied, setApplied] = useState(null);

  const load = useCallback(async () => {
    try {
      // Both at once: the pricing list is public and the account panel is
      // not, but the screen is no use with only one of them.
      const [plans, acct] = await Promise.all([listPlans(), myAccount()]);
      setRows(plans);
      setAccount(acct);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState error={state.error} onRetry={load} />;

  const mine = account?.shops?.find((s) => String(s.id) === String(businessId)) || null;
  const plan = mine?.plan || null;
  const current = plan?.code || null;
  // Only an owner may apply a licence, and the server enforces it. The box is
  // hidden rather than shown and then refused, which would read as a bug.
  const isOwner = (mine?.role || "") === "owner";

  async function apply() {
    setKeyError("");
    setApplied(null);
    if (!key.trim()) return setKeyError("Type the key from your invoice or email.");
    if (!businessId) return setKeyError("Pick a shop first.");
    setApplying(true);
    try {
      const out = await redeemLicence({ code: key, businessId });
      setApplied(out);
      setKey("");
      // The plan on screen has just changed, so everything is re-read
      // rather than patched in by hand.
      await load();
    } catch (e) {
      setKeyError(e.message || "That key could not be applied.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <Screen>
      {/* ---------------------------------------------------------------- */}
      {/* what this shop is on                                            */}
      {/* ---------------------------------------------------------------- */}
      <Card style={{ marginBottom: space(4) }}>
        <T variant="label">Your plan</T>
        {plan ? (
          <>
            <Row gap={2} style={{ marginTop: space(1.5) }}>
              <T variant="h1">{plan.name}</T>
              {plan.status === "trial" ? <Pill tone="warn">trial</Pill> : null}
            </Row>
            <T variant="sub" style={{ marginTop: space(1) }}>
              {plan.endsAt ? `${remaining(plan.daysLeft)} — until ${longDate(plan.endsAt)}` : "No end date."}
            </T>
            {plan.expiringSoon ? (
              <Note tone="warn" style={{ marginTop: space(3) }}>
                {[
                  `This plan ${plan.daysLeft <= 0 ? "has run out" : `ends in ${plan.daysLeft} day${plan.daysLeft === 1 ? "" : "s"}`}. `,
                  "Renewing early does not waste anything — the days left are added on top.",
                ]}
              </Note>
            ) : null}
            <Row gap={4} style={{ marginTop: space(3) }}>
              <View>
                <T variant="tiny">Users</T>
                <T num style={{ fontWeight: "700" }}>
                  {plan.maxUsers}
                </T>
              </View>
              <View>
                <T variant="tiny">Devices</T>
                <T num style={{ fontWeight: "700" }}>
                  {plan.maxDevices}
                </T>
              </View>
              <View>
                <T variant="tiny">Active licences</T>
                <T num style={{ fontWeight: "700" }}>
                  {account?.activeLicences ?? 0}
                </T>
              </View>
            </Row>
          </>
        ) : (
          <Note tone="info" style={{ marginTop: space(2) }}>
            This shop is not on any plan yet.
          </Note>
        )}
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* already have a licence?                                          */}
      {/* ---------------------------------------------------------------- */}
      {isOwner ? (
        <Card style={{ marginBottom: space(4) }}>
          <T variant="label">Already have a licence key?</T>
          <T variant="sub" style={{ marginTop: space(1), marginBottom: space(3) }}>
            From an invoice, an email, or a dealer. Applying it to this shop adds the time to whatever is
            left.
          </T>
          <Field
            label="Licence key"
            required
            placeholder="ABCDE-12345-FGHJK-67890"
            value={key}
            onChangeText={setKey}
            autoCapitalize="characters"
            autoCorrect={false}
            error={keyError}
            hint="Lower case and missing dashes are fine."
          />
          <Button
            title={applying ? "Applying…" : "Apply to this shop"}
            icon="check"
            onPress={apply}
            disabled={applying}
            style={{ marginTop: space(3) }}
          />
          {applied ? (
            <Note tone="good" style={{ marginTop: space(3) }}>
              {[
                applied.extended
                  ? `${applied.months} months added. `
                  : `${applied.planName} is on. `,
                `Now runs until ${longDate(applied.expiresAt)}.`,
              ]}
            </Note>
          ) : null}
        </Card>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* the licences on this account                                     */}
      {/* ---------------------------------------------------------------- */}
      {account?.licences?.length ? (
        <Card style={{ marginBottom: space(4) }}>
          <T variant="label" style={{ marginBottom: space(2) }}>
            Your licences ({account.activeLicences} active)
          </T>
          {account.licences.map((l, i) => (
            <View key={String(l.id)}>
              {i > 0 ? <Divider style={{ marginVertical: space(2.5) }} /> : null}
              <Row>
                <View style={{ flex: 1 }}>
                  <T num style={{ fontWeight: "700", letterSpacing: 0.5, fontSize: 13 }}>
                    {l.code}
                  </T>
                  <T variant="tiny" style={{ marginTop: space(0.5) }}>
                    {[l.planName, l.businessName].filter(Boolean).join(" · ")}
                  </T>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Pill tone={l.status === "active" ? "ok" : l.status === "revoked" ? "bad" : "info"}>
                    {l.status}
                  </Pill>
                  {l.expiresAt ? <T variant="tiny">till {longDate(l.expiresAt)}</T> : null}
                </View>
              </Row>
            </View>
          ))}
        </Card>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* every shop on this account                                       */}
      {/* ---------------------------------------------------------------- */}
      {account?.shops?.length > 1 ? (
        <Card style={{ marginBottom: space(4) }}>
          <T variant="label" style={{ marginBottom: space(2) }}>
            Your shops
          </T>
          {account.shops.map((s, i) => (
            <View key={String(s.id)}>
              {i > 0 ? <Divider style={{ marginVertical: space(2) }} /> : null}
              <Row>
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: "600" }}>{s.name}</T>
                  <T variant="tiny">{s.plan ? s.plan.name : "no plan"}</T>
                </View>
                {s.plan?.expiringSoon ? (
                  <Pill tone="warn">{remaining(s.plan.daysLeft)}</Pill>
                ) : (
                  <T variant="tiny">{s.plan ? remaining(s.plan.daysLeft) : ""}</T>
                )}
              </Row>
            </View>
          ))}
        </Card>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* the plans themselves                                             */}
      {/* ---------------------------------------------------------------- */}
      <T variant="label" style={{ marginBottom: space(2) }}>
        Plans
      </T>
      {rows.length === 0 ? (
        <Note tone="info">No plans are set up on the server yet.</Note>
      ) : (
        rows.map((p) => {
          const on = current && String(current) === String(p.code);
          return (
            <Card key={p.id} style={[{ marginBottom: space(4) }, on && st.on]}>
              <Row>
                <View style={{ flex: 1 }}>
                  <Row gap={1.5}>
                    <T variant="h2">{p.name}</T>
                    {on ? (
                      <View style={st.tag}>
                        <T variant="tiny" style={{ color: colors.brandInk, fontWeight: "700" }}>
                          your plan
                        </T>
                      </View>
                    ) : null}
                  </Row>
                  {/* The same plan costs different amounts depending on
                      whether it is for the phone, the computer or both, and
                      for one year or three. Picking one of those to show here
                      would be picking a number the shopkeeper might not be
                      charged, so the cheapest is shown as a FROM price and
                      the choosing happens where the buying happens. */}
                  <T num style={{ fontSize: 24, fontWeight: "800", marginTop: space(1) }}>
                    {p.pricePaise === 0 && !cheapestYear(p)
                      ? "Free"
                      : rupees(cheapestYear(p) ?? p.pricePaise, { decimals: false })}
                  </T>
                  {p.pricePaise > 0 || cheapestYear(p) ? (
                    <T variant="tiny">
                      {cheapestYear(p) !== null && p.prices.length > 1
                        ? "from, for a year — depends on phone or computer"
                        : p.months === 1
                          ? "a month"
                          : p.months === 12
                            ? "a year"
                            : `for ${p.months} months`}
                    </T>
                  ) : null}
                </View>
              </Row>

              {Array.isArray(p.features) && p.features.length ? (
                <View style={{ marginTop: space(3) }}>
                  {p.features.map((f) => (
                    <Row key={String(f)} gap={2} style={{ paddingVertical: space(0.5) }}>
                      <Icon name="check" size={15} color={colors.brand} />
                      <T variant="sub" style={{ flex: 1 }}>
                        {String(f)}
                      </T>
                    </Row>
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })
      )}

      {/* ---------------------------------------------------------------- */}
      {/* buying one                                                       */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <T variant="label" style={{ marginBottom: space(2) }}>
          Buying or changing a plan
        </T>
        <T variant="sub">
          Paying from inside the app is not switched on yet. Bank transfer is fine — write or message, and
          the key is sent to you the same working day.
        </T>
        <Row style={{ marginTop: space(3), gap: space(3) }}>
          <Button
            title="Email"
            icon="mail"
            style={{ flex: 1 }}
            onPress={async () => {
              const ok = await openUrl(mailto("myGallaBook — changing my plan"));
              if (!ok) setSaid(`Write to ${SUPPORT.email}`);
            }}
          />
          <Button
            title="WhatsApp"
            icon="message"
            style={{ flex: 1 }}
            onPress={async () => {
              const ok = await openUrl(whatsappTo("I want to change myGallaBook plan"));
              if (!ok) setSaid(`Message +${SUPPORT.whatsapp}`);
            }}
          />
        </Row>
        {said ? (
          <Note tone="info" style={{ marginTop: space(3) }}>
            {said}
          </Note>
        ) : null}
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  on: { borderWidth: 2, borderColor: colors.brand },
  tag: {
    paddingHorizontal: space(1.5),
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: colors.brandSoft,
  },
});
