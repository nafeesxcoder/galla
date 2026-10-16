// ===========================================================================
// HELP
// ---------------------------------------------------------------------------
// The questions that actually get asked, answered in the words a shopkeeper
// would use. Not a manual - a manual nobody reads is a manual that does not
// exist - so each answer is three lines and a tap to the screen it is about.
// ===========================================================================

import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, Divider, Note, Row, Screen, T } from "../../components/ui";
import { Icon } from "../../components/icons";
import { SUPPORT, mailto, openUrl, whatsappTo } from "../../lib/support";
import { colors, radius, space } from "../../lib/theme";

const QUESTIONS = [
  {
    q: "The bill total is different from what I worked out",
    a: "Check whether the item's price includes tax. A ₹59 soap with 18% GST marked as price-includes-tax is ₹50 plus ₹9; marked the other way it is ₹59 plus ₹10.62. Open the item and look at the line under the price.",
    href: "/items",
  },
  {
    q: "Why does my bill say Invoice instead of Tax Invoice",
    a: "Because the shop has no GSTIN saved. Without one you cannot charge GST on a bill, so the tax columns are left off too. Add it under Shop details and bills print as Tax Invoice from then on.",
    href: "/more/settings",
  },
  {
    q: "A customer paid for four bills at once",
    a: "Open the customer and use Take payment with the whole amount. It is set against the oldest bills first, which is what an account works like. You do not need to split it yourself.",
    href: "/parties",
  },
  {
    q: "Somebody gave me a cheque",
    a: "Record the payment with Cheque as the mode. It waits under Cheques and counts towards nothing until you mark it cleared — because until it clears you do not have the money.",
    href: "/cashbank/cheques",
  },
  {
    q: "The drawer does not match what the app says",
    a: "Open Cash in hand and read the list. Nine times out of ten something was paid out in cash and never recorded. If you cannot find it, use Cash short so the figure is honest from today.",
    href: "/cashbank/cash",
  },
  {
    q: "I took money to the bank and now the drawer is wrong",
    a: "Record it as a deposit, under Cash in hand. Without that row the drawer keeps climbing all month and the bank figure never moves.",
    href: "/cashbank/cash",
  },
  {
    q: "Stock count is wrong",
    a: "Open the item and use Fix the count. It records why it changed and keeps the history, rather than quietly overwriting the number.",
    href: "/items",
  },
  {
    q: "How do I file my GST return from this",
    a: "Reports has a GST section: taxable value, CGST, SGST and IGST by rate, with sales to registered businesses separated from the rest. Those are the figures that go into GSTR-1 and 3B.",
    href: "/more/reports",
  },
  {
    q: "What if I lose my phone",
    a: "Nothing is only on the phone — it all lives on the server, and signing in on another phone brings it back. Take a backup anyway, and keep it somewhere that is not the phone.",
    href: "/more/backup",
  },
  {
    q: "Can my shop assistant use it",
    a: "Yes, with their own login and their own role, so a bill always says who made it. Staff accounts are not switched on yet — see Staff and sharing.",
    href: "/more/staff",
  },
];

export default function Help() {
  const router = useRouter();
  const [open, setOpen] = useState(null);
  const [said, setSaid] = useState("");

  return (
    <Screen>
      <Card pad={false}>
        {QUESTIONS.map((item, i) => {
          const on = open === i;
          return (
            <View key={item.q}>
              {i ? <Divider /> : null}
              <Pressable
                onPress={() => setOpen(on ? null : i)}
                accessibilityRole="button"
                accessibilityLabel={item.q}
                accessibilityState={{ expanded: on }}
                style={({ pressed }) => [st.row, pressed && { backgroundColor: colors.sunken }]}
              >
                <T style={{ flex: 1, fontWeight: "600" }}>{item.q}</T>
                <Icon name={on ? "up" : "down"} size={18} color={colors.ink3} />
              </Pressable>
              {on ? (
                <View style={st.answer}>
                  <T variant="sub">{item.a}</T>
                  {item.href ? (
                    <Button
                      title="Take me there"
                      kind="ghost"
                      size="sm"
                      onPress={() => router.push(item.href)}
                      style={{ marginTop: space(2), alignSelf: "flex-start" }}
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </Card>

      <Card style={{ marginTop: space(5) }}>
        <T variant="label" style={{ marginBottom: space(2) }}>
          Still stuck
        </T>
        <T variant="sub">
          Say what you were doing and what happened. A photo of the screen helps more than a description.
        </T>
        <Row style={{ marginTop: space(3), gap: space(3) }}>
          <Button
            title="Email us"
            icon="mail"
            style={{ flex: 1 }}
            onPress={async () => {
              const ok = await openUrl(mailto("myGallaBook — something is not working"));
              if (!ok) setSaid(`Write to ${SUPPORT.email}`);
            }}
          />
          <Button
            title="WhatsApp"
            icon="message"
            style={{ flex: 1 }}
            onPress={async () => {
              const ok = await openUrl(whatsappTo());
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(3.5),
  },
  answer: {
    paddingHorizontal: space(4),
    paddingBottom: space(4),
    backgroundColor: colors.sunken,
    paddingTop: space(1),
  },
});
