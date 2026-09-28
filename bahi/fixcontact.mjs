#!/usr/bin/env node
/* ===========================================================================
   GALLA - point the footer "Contact Us" link at /contact
   ---------------------------------------------------------------------------
   Run this from the project root (the folder that has package.json):

       node fixcontact.mjs

   It scans lib/ and components/ for a link whose label mentions "Contact"
   but whose href is "/about" (or "/about-us"), and repoints it to /contact.
   It handles the usual shapes:

       ["Contact Us", "/about"]
       { label: "Contact Us", href: "/about" }
       { href: "/about", label: "Contact Us" }
       "Contact Us": "/about"

   Every file it changes is backed up as .bak first.
   If it finds nothing, it prints every line that mentions Contact so you can
   see exactly what to change by hand.
   =========================================================================== */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

if (!fs.existsSync(path.join(root, "package.json"))) {
  console.error("\n  Stop - this does not look like the project root.");
  console.error("  Change into the folder that has package.json and run it again.\n");
  process.exit(1);
}

const OLD = "/about(?:-us)?";
const NEW = "/contact";

// the four shapes above, in the same order
const RULES = [
  // ["Contact Us", "/about"]
  [new RegExp(`(["'\`]\\s*Contact[^"'\`]*["'\`]\\s*,\\s*["'\`])${OLD}(["'\`])`, "gi"), `$1${NEW}$2`],
  // { label: "Contact Us", href: "/about" }   (also name:, title:, text:)
  [new RegExp(`((?:label|name|title|text)\\s*:\\s*["'\`]\\s*Contact[^"'\`]*["'\`][^}]*?(?:href|url|to)\\s*:\\s*["'\`])${OLD}(["'\`])`, "gi"), `$1${NEW}$2`],
  // { href: "/about", label: "Contact Us" }
  [new RegExp(`((?:href|url|to)\\s*:\\s*["'\`])${OLD}(["'\`][^}]*?(?:label|name|title|text)\\s*:\\s*["'\`]\\s*Contact)`, "gi"), `$1${NEW}$2`],
  // "Contact Us": "/about"
  [new RegExp(`(["'\`]\\s*Contact[^"'\`]*["'\`]\\s*:\\s*["'\`])${OLD}(["'\`])`, "gi"), `$1${NEW}$2`],
];

const DIRS = ["lib", "components", "app", "data", "config"];
const EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".json"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (EXT.has(path.extname(e.name)) && !e.name.endsWith(".bak")) out.push(full);
  }
  return out;
}

const files = DIRS.flatMap((d) => walk(path.join(root, d)));
let changed = 0;
const mentions = [];

for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  if (!/contact/i.test(before)) continue;

  let after = before;
  for (const [re, to] of RULES) after = after.replace(re, to);

  const rel = path.relative(root, file).replace(/\\/g, "/");

  if (after !== before) {
    if (!fs.existsSync(file + ".bak")) fs.copyFileSync(file, file + ".bak");
    fs.writeFileSync(file, after, "utf8");
    console.log("  fixed   " + rel);

    before.split("\n").forEach((line, i) => {
      const now = after.split("\n")[i];
      if (now !== line) {
        console.log("          - " + line.trim());
        console.log("          + " + now.trim());
      }
    });

    changed++;
  } else {
    before.split("\n").forEach((line, i) => {
      if (/contact/i.test(line) && /\/(about|#|")/i.test(line)) {
        mentions.push(`${rel}:${i + 1}  ${line.trim()}`);
      }
    });
  }
}

if (changed) {
  console.log("\n  Done - " + changed + " file(s) updated. Restart npm run dev.\n");
} else {
  console.log("\n  No link matched the usual shapes.");
  if (mentions.length) {
    console.log("  Here is every Contact line found, change the href by hand:\n");
    mentions.slice(0, 40).forEach((m) => console.log("    " + m));
  } else {
    console.log("  No Contact link found in lib/, components/ or app/ at all.");
  }
  console.log("");
}
