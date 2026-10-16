#!/usr/bin/env node
// ===========================================================================
// GALLA - A WAY INTO THE APP FROM THE WEBSITE
// ---------------------------------------------------------------------------
// Until now /app could only be reached by typing it. A shopkeeper who has
// signed in should be one click from the till, not hunting for a URL.
//
// Three places, all of them only once somebody is signed in:
//
//   the navbar        an "Open app" pill beside My Account
//   that dropdown     "Open the app" as its first item, which is what a
//                     phone actually uses
//   /account          a primary button in the header
//
// Signed out, nothing on the site changes - the navbar still shows Login
// exactly as it does now.
//
// It also clears out the .bak files the earlier installers left behind. They
// existed so a bad run could be undone; every one of them has since been
// superseded, and one is an old lib/api.js that would break the build if it
// were ever restored by hand.
//
// Run from your WEBSITE folder:
//   node applink.mjs
//
// Anything it changes is backed up first, and those three are the only .bak
// files left when it finishes. Safe to run twice.
// ===========================================================================

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

if (!fs.existsSync(path.join(ROOT, "components/account/AccountMenu.js"))) {
  console.error("Stop - components/account/AccountMenu.js is not here.");
  console.error("cd into the website folder (the one with app/ and components/), then run this again.");
  process.exit(1);
}

let changed = 0;

function patch(rel, label, fn) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.log("SKIP  " + rel + " - not found.");
    return;
  }
  const before = fs.readFileSync(abs, "utf8");
  let after;
  try {
    after = fn(before);
  } catch (e) {
    console.error("STOP  " + rel + " - " + e.message);
    console.error("      Nothing was changed in this file. Tell me and I will adjust it.");
    return;
  }
  if (after == null || after === before) {
    console.log("OK    " + rel + " - " + label + " already done.");
    return;
  }
  fs.copyFileSync(abs, abs + ".bak");
  fs.writeFileSync(abs, after);
  console.log("PATCH " + rel + " - " + label);
  changed++;
}

// ---------------------------------------------------------------------------
// 1. the navbar pill, and the first item in the dropdown
// ---------------------------------------------------------------------------
patch("components/account/AccountMenu.js", "Open app", (s) => {
  if (s.includes("ac-openapp")) return null;

  // The pill goes INSIDE the existing .ac-menu div rather than beside it.
  // Returning two elements where the navbar expects one makes the pill wrap
  // onto its own line and sit on top of the My Account button - the navbar
  // lays its children out, and it was only ever given one child here.
  // Keeping a single root means Navbar.js does not have to be touched and
  // its layout cannot be disturbed.
  const openDiv = '  return (\n    <div className="ac-menu" ref={box}>';
  if (!s.includes(openDiv)) throw new Error("could not find the menu's opening tag");

  let out = s.replace(
    openDiv,
    openDiv +
      '\n      <Link href="/app" className="ac-openapp" onClick={onClick}>\n' +
      "        Open app\n" +
      "      </Link>\n"
  );

  // the dropdown's first item, which is what a phone actually uses
  const myAccount = '          <Link href="/account" onClick={shut}>';
  if (!out.includes(myAccount)) throw new Error("could not find the My account link");
  out = out.replace(
    myAccount,
    '          <Link href="/app" onClick={shut} className="ac-menu__app">\n' +
      "            Open the app\n" +
      "          </Link>\n\n" +
      myAccount
  );

  return out;
});

// ---------------------------------------------------------------------------
// 2. the styling for both
// ---------------------------------------------------------------------------
const OPEN_APP_CSS = [
  "",
  "/* --------------------------------------------------------------------------",
  "   Open app",
  "   --------------------------------------------------------------------------",
  "   The way from the website into the till. Only ever rendered when somebody",
  "   is signed in, so a visitor never sees it.",
  "   -------------------------------------------------------------------------- */",
  "",
  "/* .ac-menu now holds the pill as well as the button, so it lays them out in",
  "   a row. It keeps position: relative from the rule above, which is what the",
  "   dropdown is positioned against. */",
  ".ac-menu {",
  "  display: inline-flex;",
  "  align-items: center;",
  "  gap: 0.3rem;",
  "}",
  "",
  "/* The navbar styles its links by a descendant rule, which beats a single",
  "   class. Naming the tag as well puts this ahead of it - without that the",
  "   pill comes out dark green on green and is barely readable. */",
  ".ac-menu a.ac-openapp,",
  "a.ac-openapp {",
  "  display: inline-flex;",
  "  align-items: center;",
  "  padding: 0.34rem 0.72rem;",
  "  border-radius: 999px;",
  "  background: var(--brand, #0b6e4f);",
  "  color: #fff;",
  "  font-weight: 600;",
  "  font-size: 0.86rem;",
  "  line-height: 1.2;",
  "  text-decoration: none;",
  "  white-space: nowrap;",
  "}",
  "",
  ".ac-menu a.ac-openapp:hover,",
  "a.ac-openapp:hover {",
  "  background: #085840;",
  "  color: #fff;",
  "}",
  "",
  "/* Without this the extra pill squeezes the navbar enough to break",
  "   \"My Account\" across two lines. */",
  ".ac-menu__btn {",
  "  white-space: nowrap;",
  "}",
  "",
  "/* In the dropdown it is the first thing, and should read as the main action",
  "   rather than one more link in a list. */",
  ".ac-menu__drop a.ac-menu__app {",
  "  font-weight: 650;",
  "  color: var(--brand, #0b6e4f);",
  "}",
  "",
  "/* Below this the navbar has no room to spare, and the item inside the",
  "   dropdown covers it anyway. */",
  "@media (max-width: 1180px) {",
  "  .ac-menu a.ac-openapp,",
  "  a.ac-openapp {",
  "    display: none;",
  "  }",
  "}",
  "",
  ".ac-head__actions {",
  "  display: flex;",
  "  align-items: center;",
  "  gap: 0.5rem;",
  "  flex-wrap: wrap;",
  "}",
  "",
].join("\n");

patch("components/account/account.css", "Open app styles", (s) => {
  if (s.includes(".ac-openapp")) return null;
  return s + OPEN_APP_CSS;
});

// ---------------------------------------------------------------------------
// 3. the account page
// ---------------------------------------------------------------------------
patch("components/account/AccountPage.js", "Open the app button", (s) => {
  if (s.includes('href="/app"')) return null;

  const signOutBtn =
    '          <button type="button" className="btn btn--ghost btn--small" onClick={() => signOut()}>';
  if (!s.includes(signOutBtn)) throw new Error("could not find the sign out button");

  let out = s.replace(
    signOutBtn,
    '          <div className="ac-head__actions">\n' +
      '            <Link href="/app" className="btn btn--primary btn--small">\n' +
      "              Open the app\n" +
      "            </Link>\n\n" +
      signOutBtn
  );

  const closeBtn = "            {c.signOut}\n          </button>";
  if (!out.includes(closeBtn)) throw new Error("could not find the end of the sign out button");
  out = out.replace(closeBtn, closeBtn + "\n          </div>");

  if (!/^import Link from "next\/link";/m.test(out)) {
    out = out.replace(/^("use client";\n)/m, '$1import Link from "next/link";\n');
  }
  return out;
});

// ---------------------------------------------------------------------------
// 4. clear out the backups the earlier installers left
// ---------------------------------------------------------------------------
const skip = new Set(["node_modules", ".next", ".git"]);
const stale = [];

(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".bak")) stale.push(p);
  }
})(ROOT);

// the three written a moment ago by this run are the current safety net
const fresh = new Set(
  [
    "components/account/AccountMenu.js.bak",
    "components/account/account.css.bak",
    "components/account/AccountPage.js.bak",
  ].map((r) => path.join(ROOT, r))
);

let removed = 0;
for (const f of stale) {
  if (fresh.has(f)) continue;
  fs.unlinkSync(f);
  removed++;
}

console.log("");
console.log(removed ? "TIDY  removed " + removed + " old .bak files" : "OK    no old .bak files to remove.");
console.log("");
console.log(changed ? "Done - " + changed + " files changed." : "Nothing to change.");
console.log("");
console.log("=========================================================");
console.log("  RESTART npm run dev");
console.log("=========================================================");
console.log("");
console.log('Signed in, the navbar gets a green "Open app" pill, the My Account');
console.log('dropdown gets "Open the app" at the top, and /account gets a button.');
console.log("Signed out, nothing on the site changes.");
console.log("");
console.log("Then delete this file:  del applink.mjs");
