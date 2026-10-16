// ===========================================================================
// THE FRONT DOOR
// ---------------------------------------------------------------------------
// Decides where somebody opening the app belongs. It renders nothing itself -
// it waits until the session is known and then redirects, so nobody ever sees
// the login screen flash past on their way into the app.
// ===========================================================================

import { Redirect } from "expo-router";
import { View } from "react-native";
import { useSession } from "../lib/session";
import { Loading } from "../components/ui";
import { colors } from "../lib/theme";

export default function Index() {
  const { ready, signedIn, businessId, offline } = useSession();

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}>
        <Loading />
      </View>
    );
  }

  if (!signedIn) return <Redirect href="/login" />;
  // Signed in but no shop yet: a bill cannot be made without a state, which
  // is what decides CGST+SGST against IGST.
  if (!businessId && !offline) return <Redirect href="/setup" />;
  return <Redirect href="/(tabs)" />;
}
