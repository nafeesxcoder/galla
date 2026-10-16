// A bill's own number becomes the title once it has loaded; until then, and
// if it fails to load, the header still says something useful.

import { Stack } from "expo-router";
import { colors } from "../../lib/theme";

export default function BillsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.panel },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: "650" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Bills" }} />
      <Stack.Screen name="[id]" options={{ title: "Bill" }} />
    </Stack>
  );
}
