// Titles here rather than inside each screen: a screen that fails to load
// returns its error state before it renders anything, and the header would
// then read "cashbank/cheques" at exactly the moment somebody is lost.

import { Stack } from "expo-router";
import { colors } from "../../lib/theme";

export default function CashBankLayout() {
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
      <Stack.Screen name="index" options={{ title: "Cash and bank" }} />
      <Stack.Screen name="cash" options={{ title: "Cash in hand" }} />
      <Stack.Screen name="cheques" options={{ title: "Cheques" }} />
      <Stack.Screen name="[id]" options={{ title: "Account" }} />
    </Stack>
  );
}
