// ===========================================================================
// THE TABS
// ---------------------------------------------------------------------------
// Five, which is the most a thumb can aim at reliably. The order is the order
// of a working day: look at the shop, make a bill, check what is in stock,
// see who owes, and everything else behind More.
//
// New bill sits in the middle and is drawn larger, because it is what the app
// is for and it gets touched a hundred times more than anything else.
// ===========================================================================

import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSession } from "../../lib/session";
import { Redirect } from "expo-router";
import { colors, MAX_W } from "../../lib/theme";
import { Icon } from "../../components/icons";

// The one button the whole app is for: a single pill with the word in it,
// instead of a circle with a label trying to live underneath. It is wider
// than the other tabs on purpose - a shopkeeper hits this a hundred times a
// day with a thumb, usually without looking.
function BillButton({ onPress, accessibilityState }) {
  const on = Boolean(accessibilityState?.selected);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel="New bill"
      style={({ pressed }) => [tb.slot, pressed && { opacity: 0.88 }]}
    >
      <View style={[tb.pill, on && { backgroundColor: colors.brandInk }]}>
        <Icon name="plus" color="#fff" size={18} />
        <Text style={tb.word}>Bill</Text>
      </View>
    </Pressable>
  );
}

const tb = StyleSheet.create({
  slot: { flex: 1, alignItems: "center", justifyContent: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 40,
    // Narrow enough that on a 360px phone it does not sit against the "C" of
    // Customers, with a margin so it can never do so whatever the width.
    minWidth: 74,
    paddingHorizontal: 11,
    marginHorizontal: 4,
    borderRadius: 999,
    backgroundColor: colors.brand,
  },
  word: { color: "#fff", fontWeight: "700", fontSize: 14.5, lineHeight: 18 },
});

export default function TabsLayout() {
  const { ready, signedIn, businessId, offline } = useSession();

  if (!ready) return null;
  if (!signedIn) return <Redirect href="/login" />;
  if (!businessId && !offline) return <Redirect href="/setup" />;

  return (
    <Tabs
      screenOptions={{
        // An inactive tab stays mounted, which is what makes switching back
        // instant. Freezing it stops it re-rendering in the background on
        // every state change somewhere else.
        freezeOnBlur: true,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.ink3,
        // Centred and capped for the desktop window, where a bottom bar
        // spanning thirteen hundred pixels puts "Home" and "More" in
        // different postcodes.
        tabBarStyle: {
          borderTopColor: colors.line,
          backgroundColor: colors.panel,
          // 62 was too short once the Bill button became a pill with a word
          // in it: the row grew, and the labels under the other four icons
          // were cut off at the bottom edge. Tall enough for an icon, a
          // label and the pill, with room to spare.
          height: 78,
          paddingBottom: 12,
          paddingTop: 8,
          width: "100%",
          maxWidth: MAX_W,
          alignSelf: "center",
        },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: "600" },
        headerStyle: { backgroundColor: colors.panel },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "650" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color }) => <Icon name="home" color={color} /> }}
      />
      <Tabs.Screen
        name="items"
        options={{ title: "Items", tabBarIcon: ({ color }) => <Icon name="box" color={color} /> }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: "New bill",
          // The whole button is drawn here rather than left to the icon slot.
          // A tab draws its icon and its label as two separate things stacked
          // on top of each other, and a pill wide enough to be worth aiming
          // at simply ran into the word underneath it.
          tabBarButton: (props) => <BillButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="parties"
        options={{ title: "Customers", tabBarIcon: ({ color }) => <Icon name="users" color={color} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: "More", tabBarIcon: ({ color }) => <Icon name="menu" color={color} /> }}
      />
    </Tabs>
  );
}
