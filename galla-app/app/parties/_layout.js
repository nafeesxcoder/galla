import { Stack } from "expo-router";
import { colors } from "../../lib/theme";

export default function PartiesLayout() {
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
      <Stack.Screen name="[id]" options={{ title: "Customer" }} />
    </Stack>
  );
}
