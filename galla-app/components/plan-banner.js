// ===========================================================================
// "YOUR PLAN IS ABOUT TO RUN OUT"
// ---------------------------------------------------------------------------
// A plan that stops working without warning is a plan that loses a customer
// rather than renews one. The server decides when billing stops; this says it
// out loud beforehand, on the two screens a shopkeeper actually opens - the
// home screen and the bill screen.
//
// It shows nothing at all while things are fine, which is most of the time.
// A banner that is always there is wallpaper, and wallpaper is not read on
// the one day it matters.
//
// Three states, in order of how loud they are:
//
//   expiringSoon   a fortnight or less to go. A quiet line.
//   inGrace        it has ended; billing still works for a few more days.
//   blocked        new bills are being refused right now.
// ===========================================================================

import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { T } from "./ui";
import { Icon } from "./icons";
import { useSession } from "../lib/session";
import { api } from "../lib/api";
import { colors, radius, space } from "../lib/theme";

// One request shared by the screens showing this, and re-read on focus so a
// renewal is picked up without restarting the app.
let cache = { id: null, plan: null, at: 0 };
const FRESH_MS = 60 * 1000;

export default function PlanBanner() {
  const { businessId } = useSession();
  const router = useRouter();
  const [plan, setPlan] = useState(cache.id === businessId ? cache.plan : null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (!businessId) return;

      if (cache.id === businessId && Date.now() - cache.at < FRESH_MS) {
        setPlan(cache.plan);
        return;
      }

      api
        .get(`/api/businesses/${businessId}`)
        .then((biz) => {
          if (!alive) return;
          cache = { id: businessId, plan: biz?.plan ?? null, at: Date.now() };
          setPlan(cache.plan);
        })
        // Offline, or an older server with no plan state. Say nothing rather
        // than worry somebody whose plan is perfectly fine.
        .catch(() => alive && setPlan(null));

      return () => {
        alive = false;
      };
    }, [businessId])
  );

  if (!plan) return null;

  let tone = null;
  let title = "";
  let body = "";

  if (plan.blocked) {
    tone = "bad";
    title = "New bills are paused";
    body = `Your ${plan.name} plan has ended. Everything you already have is still here. Renew and billing starts again straight away.`;
  } else if (plan.inGrace) {
    tone = "warn";
    const d = plan.graceDaysLeft;
    title = `Your ${plan.name} plan has ended`;
    body = `You can still make bills for ${d} more ${d === 1 ? "day" : "days"}. Renew before that and nothing stops.`;
  } else if (plan.expiringSoon) {
    tone = "warn";
    const d = plan.daysLeft;
    title = d === 1 ? "Your plan ends tomorrow" : `Your plan ends in ${d} days`;
    body = "Renewing now does not waste anything — the days left are added on top.";
  } else {
    return null;
  }

  const c = TONES[tone];

  return (
    <Pressable
      onPress={() => router.push("/more/plans")}
      style={[st.wrap, { backgroundColor: c.bg, borderColor: c.line }]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
    >
      <Icon name={tone === "bad" ? "warn" : "history"} size={18} color={c.fg} />
      <View style={{ flex: 1 }}>
        <T style={{ color: c.fg, fontWeight: "700" }}>{title}</T>
        <T variant="tiny" style={{ color: c.fg, marginTop: space(0.5) }}>
          {body}
        </T>
      </View>
      <Icon name="chevron" size={16} color={c.fg} />
    </Pressable>
  );
}

const TONES = {
  warn: { bg: colors.warnSoft, fg: "#6f4a00", line: "#f0dcb6" },
  bad: { bg: colors.dangerSoft, fg: "#8a1c22", line: "#efc9cb" },
};

const st = {
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space(2),
    padding: space(3),
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space(3),
  },
};
