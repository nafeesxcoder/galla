// Titles live here rather than inside each screen. A screen that fails to
// load returns its error state before it ever renders a <Stack.Screen>, and
// the header would then read "more/expenses" at exactly the moment somebody
// needs to know where they are.

import { Stack } from "expo-router";
import { colors } from "../../lib/theme";

export default function MoreLayout() {
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
      <Stack.Screen name="day-close" options={{ title: "Day close" }} />
      <Stack.Screen name="expenses" options={{ title: "Expenses" }} />
      <Stack.Screen name="reports" options={{ title: "Reports" }} />
      <Stack.Screen name="settings" options={{ title: "Shop details" }} />
      <Stack.Screen name="preferences" options={{ title: "Settings" }} />
      <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Stack.Screen name="companies" options={{ title: "My shops" }} />
      <Stack.Screen name="staff" options={{ title: "Staff and sharing" }} />
      <Stack.Screen name="backup" options={{ title: "Backup" }} />
      <Stack.Screen name="utilities" options={{ title: "Utilities" }} />
      <Stack.Screen name="plans" options={{ title: "My account" }} />
      <Stack.Screen name="desktop" options={{ title: "Desktop app" }} />
      <Stack.Screen name="help" options={{ title: "Help and support" }} />
    </Stack>
  );
}
