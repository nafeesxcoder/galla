// ===========================================================================
// THE MENU
// ---------------------------------------------------------------------------
// Everything the four tabs do not reach, grouped the way a shopkeeper thinks
// about it rather than the way the code is organised:
//
//   My business          selling, buying, spending, the numbers
//   Cash and bank        where the money actually is
//   Keeping it safe      more than one shop, staff, getting the data out
//   Other                the plan, the desktop app, help
//
// Some rows open a screen. Some open a short list of their own, because
// "Sale" is five things and giving each one a row of its own would make this
// screen twenty rows long and unreadable. Those expand in place - a second
// screen just to choose between "new sale" and "all sales" is a tap and a
// page load for nothing.
// ===========================================================================

import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Card, Divider, Row, Screen, T } from "../../components/ui";
import { Icon } from "../../components/icons";
import { useSession } from "../../lib/session";
import { colors, radius, space } from "../../lib/theme";
import { BUILD } from "../../lib/build";
import { SUPPORT, mailto, openUrl, whatsappTo } from "../../lib/support";

// A row is one of three things:
//   href      opens a screen
//   children  expands to show more rows
//   action    does something here and now
const GROUPS = [
  {
    title: "My business",
    items: [
      {
        icon: "sale",
        label: "Sale",
        note: "Bills, returns, estimates, money in",
        children: [
          { label: "New sale bill", href: "/billing?docType=sale" },
          { label: "Estimate or quotation", href: "/billing?docType=estimate" },
          { label: "Sales return / credit note", href: "/billing?docType=credit_note" },
          { label: "All sale bills", href: "/bills?filter=sale" },
          { label: "Still to collect", href: "/bills?filter=unpaid" },
        ],
      },
      {
        icon: "purchase",
        label: "Purchase",
        note: "Stock coming in, returns, money out",
        children: [
          { label: "New purchase bill", href: "/billing?docType=purchase" },
          { label: "Purchase return / debit note", href: "/billing?docType=debit_note" },
          { label: "All purchase bills", href: "/bills?filter=purchase" },
        ],
      },
      { icon: "wallet", label: "Expenses", note: "Rent, electricity, transport, tea", href: "/more/expenses" },
      { icon: "pie", label: "Dashboard", note: "How the month is going", href: "/more/dashboard" },
      { icon: "chart", label: "Reports", note: "Sales, profit, GST, stock", href: "/more/reports" },
      { icon: "lock", label: "Day close", note: "Count the drawer against the app", href: "/more/day-close" },
      { icon: "bill", label: "All bills", note: "Search, filter, reprint", href: "/bills" },
    ],
  },
  {
    title: "Cash and bank",
    items: [
      { icon: "cash", label: "Cash in hand", note: "What should be in the drawer right now", href: "/cashbank/cash" },
      { icon: "bank", label: "Bank accounts", note: "Balances, deposits, withdrawals", href: "/cashbank" },
      { icon: "cheque", label: "Cheques", note: "What has not cleared yet", href: "/cashbank/cheques" },
      { icon: "loan", label: "Loan accounts", note: "What is owed, and the next instalment", href: "/loans" },
    ],
  },
  {
    title: "Keeping it safe",
    items: [
      { icon: "companies", label: "My shops", note: "More than one business on one login", href: "/more/companies" },
      { icon: "sync", label: "Staff and sharing", note: "Who else can use this shop", href: "/more/staff" },
      { icon: "cloud", label: "Backup", note: "Take a copy of everything, as a file", href: "/more/backup" },
      {
        icon: "tools",
        label: "Utilities",
        note: "Barcodes, bulk price change, stock check",
        children: [
          { label: "Print barcode labels", href: "/more/utilities?tool=labels" },
          { label: "Change prices in bulk", href: "/more/utilities?tool=prices" },
          { label: "Check my data", href: "/more/utilities?tool=verify" },
          { label: "Items running out", href: "/more/utilities?tool=lowstock" },
          { label: "Stock expiring soon", href: "/more/utilities?tool=expiry" },
        ],
      },
    ],
  },
  {
    title: "Other",
    items: [
      { icon: "price", label: "My account", note: "Your plan, licences and renewals", href: "/more/plans" },
      {
        icon: "desktop",
        label: "Desktop app",
        note: "The same shop on Windows or a Mac",
        href: "/more/desktop",
      },
      {
        icon: "grow",
        label: "Grow your business",
        note: "Reminders, WhatsApp, an online price list",
        children: [
          { label: "Chase people who owe you", href: "/parties" },
          { label: "Send a bill on WhatsApp", href: "/bills" },
          { label: "Your items as a price list", href: "/more/utilities?tool=pricelist" },
        ],
      },
      { icon: "shop", label: "Shop details", note: "Name, GSTIN, address — these print on the bill", href: "/more/settings" },
      { icon: "settings", label: "Settings", note: "Bill format, numbering, defaults", href: "/more/preferences" },
      {
        icon: "help",
        label: "Help and support",
        note: "How things work, and how to reach us",
        children: [
          { label: "How do I…", href: "/more/help" },
          { label: "Email us", action: "email" },
          { label: "WhatsApp us", action: "whatsapp" },
        ],
      },
      { icon: "star", label: "Rate this app", note: "", action: "rate" },
    ],
  },
];

export default function More() {
  const router = useRouter();
  const { shop, user, businesses, switchBusiness, signOut } = useSession();
  const [open, setOpen] = useState(null);
  const [said, setSaid] = useState("");

  async function run(action) {
    if (action === "email") {
      const ok = await openUrl(mailto());
      setSaid(ok ? "" : `No mail app here. Write to ${SUPPORT.email}`);
      return;
    }
    if (action === "whatsapp") {
      const ok = await openUrl(whatsappTo());
      setSaid(ok ? "" : `Could not open WhatsApp. The number is +${SUPPORT.whatsapp}`);
      return;
    }
    if (action === "rate") {
      // Honest rather than broken. There is no store listing yet, and a
      // button that opens a 404 is worse than one that says why it cannot.
      setSaid("Not on the Play Store or App Store yet. When it is, this will take you there.");
    }
  }

  function tapRow(item) {
    setSaid("");
    if (item.children) {
      setOpen((o) => (o === item.label ? null : item.label));
      return;
    }
    if (item.href) {
      router.push(item.href);
      return;
    }
    if (item.action) run(item.action);
  }

  return (
    <Screen>
      <Card>
        <Row>
          <View style={st.mark}>
            <T style={{ color: "#fff", fontWeight: "800", fontSize: 20 }}>
              {(shop?.name || "?").trim().charAt(0).toUpperCase()}
            </T>
          </View>
          <View style={{ flex: 1 }}>
            <T variant="h2">{shop?.name || "Your shop"}</T>
            <T variant="tiny">
              {user?.name || user?.phone || ""}
              {shop?.gstin ? ` · GSTIN ${shop.gstin}` : " · no GSTIN yet"}
            </T>
          </View>
          <Pressable
            onPress={() => router.push("/more/settings")}
            accessibilityRole="button"
            accessibilityLabel="Edit shop details"
            hitSlop={8}
          >
            <Icon name="edit" size={18} color={colors.ink3} />
          </Pressable>
        </Row>

        {businesses?.length > 1 ? (
          <View style={{ marginTop: space(4) }}>
            <T variant="label" style={{ marginBottom: space(2) }}>
              Switch shop
            </T>
            {businesses.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => switchBusiness(b.id)}
                style={({ pressed }) => [st.shopRow, pressed && { backgroundColor: colors.sunken }]}
              >
                <T style={{ flex: 1, fontWeight: String(b.id) === String(shop?.id) ? "700" : "400" }}>{b.name}</T>
                {String(b.id) === String(shop?.id) ? <Icon name="check" size={18} color={colors.brand} /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </Card>

      {said ? (
        <View style={st.said}>
          <Icon name="info" size={16} color={colors.ink2} />
          <T variant="tiny" style={{ flex: 1 }}>
            {said}
          </T>
        </View>
      ) : null}

      {GROUPS.map((g) => (
        <View key={g.title} style={{ marginTop: space(5) }}>
          <T variant="label" style={{ marginBottom: space(2), marginLeft: space(1) }}>
            {g.title}
          </T>
          <Card pad={false}>
            {g.items.map((it, i) => {
              const expanded = open === it.label;
              return (
                <View key={it.label}>
                  {i ? <Divider /> : null}
                  <Pressable
                    onPress={() => tapRow(it)}
                    accessibilityRole="button"
                    accessibilityLabel={it.label}
                    accessibilityState={it.children ? { expanded } : undefined}
                    style={({ pressed }) => [st.row, pressed && { backgroundColor: colors.sunken }]}
                  >
                    <View style={st.iconBox}>
                      <Icon name={it.icon} size={19} color={colors.brandInk} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <T style={{ fontWeight: "650" }}>{it.label}</T>
                      {it.note ? <T variant="tiny">{it.note}</T> : null}
                    </View>
                    <Icon
                      name={it.children ? (expanded ? "up" : "down") : "chevron"}
                      size={18}
                      color={colors.ink3}
                    />
                  </Pressable>

                  {expanded
                    ? it.children.map((c) => (
                        <Pressable
                          key={c.label}
                          onPress={() => {
                            setSaid("");
                            if (c.href) router.push(c.href);
                            else if (c.action) run(c.action);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={c.label}
                          style={({ pressed }) => [st.child, pressed && { backgroundColor: colors.line }]}
                        >
                          <View style={st.tick} />
                          <T style={{ flex: 1 }}>{c.label}</T>
                          <Icon name="chevron" size={16} color={colors.ink3} />
                        </Pressable>
                      ))
                    : null}
                </View>
              );
            })}
          </Card>
        </View>
      ))}

      <Pressable
        onPress={signOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        style={({ pressed }) => [st.signOut, pressed && { backgroundColor: colors.sunken }]}
      >
        <Icon name="logout" size={18} color={colors.danger} />
        <T style={{ color: colors.danger, fontWeight: "650" }}>Sign out</T>
      </Pressable>

      {/* The build stamp earns its place: "am I running the update I just
          installed?" is otherwise unanswerable, and a stale copy of the app
          looks exactly like a missing feature. */}
      <T variant="tiny" style={{ textAlign: "center", marginTop: space(5) }}>
        {`myGallaBook · version 1.0 · build ${BUILD.stamp}`}
      </T>
      {BUILD.screens ? (
        <T variant="tiny" style={{ textAlign: "center" }}>
          {`${BUILD.screens} screens`}
        </T>
      ) : null}
    </Screen>
  );
}

const st = StyleSheet.create({
  mark: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(3.5),
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  // Indented and on a tint, so an expanded list reads as belonging to the
  // row above it rather than as four more top-level entries.
  child: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingLeft: space(4) + 36 + space(3),
    paddingRight: space(4),
    paddingVertical: space(3),
    backgroundColor: colors.sunken,
  },
  tick: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.ink3 },
  shopRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space(3),
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  said: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    marginTop: space(3),
    padding: space(3),
    borderRadius: radius.sm,
    backgroundColor: colors.sunken,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space(2),
    marginTop: space(6),
    paddingVertical: space(4),
    borderWidth: 1,
    borderColor: "#e9bfc1",
    borderRadius: radius.sm,
    backgroundColor: colors.panel,
  },
});
