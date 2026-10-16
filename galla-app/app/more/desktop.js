// ===========================================================================
// THE DESKTOP APP
// ---------------------------------------------------------------------------
// The same shop, the same data, on a Windows machine or a Mac. Not a separate
// product and not a separate subscription: the same code, wrapped so it runs
// as a proper application with its own window and icon.
//
// Which matters because a counter with a keyboard and a laser scanner bills
// three times faster than a thumb on a phone, and most shops have both.
// ===========================================================================

import { Platform, View } from "react-native";
import { Button, Card, Note, Row, Screen, T } from "../../components/ui";
import { Icon } from "../../components/icons";
import { getApiUrl } from "../../lib/api";
import { colors, space } from "../../lib/theme";

const isDesktopApp =
  Platform.OS === "web" &&
  typeof window !== "undefined" &&
  // The Tauri wrapper serves the app from its own origin rather than from a
  // web server, which is the one reliable way to tell the installed desktop
  // app apart from the same page in a browser tab.
  /^(tauri:|https?:\/\/tauri\.localhost)/.test(window.location?.origin || "");

export default function Desktop() {
  return (
    <Screen>
      {isDesktopApp ? (
        <Note tone="good" title="You are already in it">
          This is the desktop app. Everything here is the same shop as on your phone — the two stay in
          step because they both talk to the same server.
        </Note>
      ) : null}

      <Card style={{ marginTop: isDesktopApp ? space(4) : 0 }}>
        <Row>
          <Icon name="desktop" size={22} color={colors.brandInk} />
          <T variant="h2" style={{ flex: 1 }}>
            myGallaBook on Windows and Mac
          </T>
        </Row>
        <T variant="sub" style={{ marginTop: space(2) }}>
          A proper application with its own window and icon — not a browser tab. The same shop, the same
          bills, the same customers.
        </T>

        <View style={{ marginTop: space(4) }}>
          <Point icon="barcode" title="A real scanner">
            A USB laser scanner types into the item box the way a keyboard does. Scan, scan, scan, print.
          </Point>
          <Point icon="print" title="Any printer">
            A4 on an office printer, or 80mm on a thermal one at the counter.
          </Point>
          <Point icon="box" title="Bulk work">
            Adding two hundred items or fixing prices across a category is work for a keyboard.
          </Point>
          <Point icon="sync" title="The same data">
            Bill on the desktop, take the payment on your phone. Neither has its own copy.
          </Point>
        </View>
      </Card>

      <Card style={{ marginTop: space(4) }}>
        <T variant="label" style={{ marginBottom: space(2) }}>
          How to get it
        </T>
        <T variant="sub">
          The installers are not on a download page yet. Until they are, ask and you will be sent the file
          for Windows (.msi) or Mac (.dmg) directly.
        </T>
        <Note tone="warn" style={{ marginTop: space(3) }}>
          The first build is not signed, so Windows shows an &quot;unrecognised app&quot; warning and a Mac
          asks you to right-click and choose Open. That is the warning for software without a paid
          certificate, not a problem with the file.
        </Note>
      </Card>

      <Card style={{ marginTop: space(4) }}>
        <T variant="label" style={{ marginBottom: space(2) }}>
          One thing to set
        </T>
        <T variant="sub">
          The desktop app has to know where your server is, the same as this one does. It asks on first
          run.
        </T>
        <T variant="tiny" style={{ marginTop: space(2) }}>
          {`This copy is talking to ${getApiUrl() || "nothing yet"}.`}
        </T>
      </Card>
    </Screen>
  );
}

function Point({ icon, title, children }) {
  return (
    <Row gap={3} style={{ alignItems: "flex-start", marginTop: space(3) }}>
      <Icon name={icon} size={18} color={colors.brandInk} />
      <View style={{ flex: 1 }}>
        <T style={{ fontWeight: "650" }}>{title}</T>
        <T variant="tiny">{children}</T>
      </View>
    </Row>
  );
}
