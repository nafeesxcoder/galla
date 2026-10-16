// ===========================================================================
// THE ROOT
// ---------------------------------------------------------------------------
// Everything sits inside the session, so no screen has to wonder whether it
// knows who is signed in yet.
// ===========================================================================

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../lib/session";
import { Loading } from "../components/ui";
import { colors } from "../lib/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Routes />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

// Nothing renders until the session has been read off the device.
//
// The tokens and the server address both live in storage, and reading them is
// asynchronous. Without this gate a screen opened directly - a deep link, or
// the desktop window restoring the page it was last on - mounts first and
// asks the server for data before the app knows which server that is. The
// result was a Reports screen reporting "no server address set yet" while the
// address sat in storage, perfectly saved, a few milliseconds away.
//
// Going through the app from the first screen hid it, because by the time
// anybody tapped anything hydration had long finished. Only a cold start
// straight into a screen showed it, which is exactly the case the desktop
// build makes ordinary.
function Routes() {
  const { ready } = useSession();

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}>
        <Loading />
      </View>
    );
  }

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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="setup" options={{ title: "Set up your shop" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Each of these has its own stack, so the parent must not draw a
          second header on top of theirs. */}
      <Stack.Screen name="bills" options={{ headerShown: false }} />
      <Stack.Screen name="items" options={{ headerShown: false }} />
      <Stack.Screen name="parties" options={{ headerShown: false }} />
      <Stack.Screen name="more" options={{ headerShown: false }} />
    </Stack>
  );
}
