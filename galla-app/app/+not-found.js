// A screen that should never be reached, written anyway. A bad deep link, a
// stale notification, or a part of the app that is still being built should
// leave somebody looking at a way back rather than a blank page.

import { Link } from "expo-router";
import { Empty, Screen } from "../components/ui";
import { colors } from "../lib/theme";

export default function NotFound() {
  return (
    <Screen style={{ flex: 1, justifyContent: "center" }}>
      <Empty
        title="Nothing here"
        body="That screen does not exist, or is still being built."
        action={
          <Link href="/(tabs)" style={{ color: colors.brandInk, fontWeight: "700", fontSize: 16 }}>
            Back to the shop
          </Link>
        }
      />
    </Screen>
  );
}
