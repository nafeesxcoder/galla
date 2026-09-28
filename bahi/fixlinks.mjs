#!/usr/bin/env node
/* ===========================================================================
   GALLA - point the footer legal links at the right pages
   ---------------------------------------------------------------------------
   Run this from the project root (the folder that has package.json):

       node fixlinks.mjs

   It scans lib/, components/, app/, data/ and config/ for links whose label
   mentions one of these words but whose href is "/about" or "/about-us",
   "#" or empty, and repoints each one:

       Contact  ->  /contact
       Terms    ->  /terms
       Privacy  ->  /privacy
       Refund   ->  /refund

   It handles the usual shapes:

       ["Terms & Condition", "/about"]
       { label: "Privacy policy", href: "/about" }
       { href: "/about", label: "Refund policy" }
       "Contact us": "/about"

   A real "About Us" link is left alone - only entries whose label matches
   one of the words above are touched. Every changed file is backed up .bak.
   =========================================================================== */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

if (!fs.existsSync(path.join(root, "package.json"))) {
  console.error("\n  Stop - this does not look like the project root.");
  console.error("  Change into the folder that has package.json and run it again.\n");
  process.exit(1);
}

// label keyword  ->  where it should point
const MAP = [
  ["Contact", "/contact"],
  ["Terms", "/terms"],
  ["Privacy", "/privacy"],
  ["Refund", "/refund"],
  ["Cancellation", "/refund"],
];

// the wrong hrefs we are willing to replace
const BAD = "(?:/about(?:-us)?|#|)";

function rulesFor(word, to) {
  const L = `["'\`]\\s*[^"'\`]*${word}[^"'\`]*["'\`]`; // a label containing the word
  return [
    // ["Terms & Condition", "/about"]
    [new RegExp(`(${L}\\s*,\\s*["'\`])${BAD}(["'\`])`, "gi"), `$1${to}$2`],
    // { label: "Terms", href: "/about" }
    [
      new RegExp(
        `((?:label|name|title|text)\\s*:\\s*${L}[^}]*?(?:href|url|to)\\s*:\\s*["'\`])${BAD}(["'\`])`,
        "gi"
      ),
      `$1${to}$2`,
    ],
    // { href: "/about", label: "Terms" }
    [
      new RegExp(
        `((?:href|url|to)\\s*:\\s*["'\`])${BAD}(["'\`][^}]*?(?:label|name|title|text)\\s*:\\s*${L})`,
        "gi"
      ),
      `$1${to}$2`,
    ],
    // "Terms": "/about"
    [new RegExp(`(${L}\\s*:\\s*["'\`])${BAD}(["'\`])`, "gi"), `$1${to}$2`],
  ];
}

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
const leftovers = [];

for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  if (!MAP.some(([w]) => new RegExp(w, "i").test(before))) continue;

  let after = before;
  for (const [word, to] of MAP) {
    for (const [re, rep] of rulesFor(word, to)) after = after.replace(re, rep);
  }

  const rel = path.relative(root, file).replace(/\\/g, "/");

  if (after !== before) {
    if (!fs.existsSync(file + ".bak")) fs.copyFileSync(file, file + ".bak");
    fs.writeFileSync(file, after, "utf8");
    console.log("  fixed   " + rel);

    const a = before.split("\n");
    const bLines = after.split("\n");
    a.forEach((line, i) => {
      if (bLines[i] !== line) {
        console.log("          - " + line.trim());
        console.log("          + " + bLines[i].trim());
      }
    });

    changed++;
  } else {
    before.split("\n").forEach((line, i) => {
      const hasWord = MAP.some(([w]) => new RegExp(w, "i").test(line));
      if (hasWord && /\/about|["'`]#["'`]/.test(line)) {
        leftovers.push(`${rel}:${i + 1}  ${line.trim()}`);
      }
    });
  }
}

if (changed) {
  console.log("\n  Done - " + changed + " file(s) updated. Restart npm run dev.\n");
} else {
  console.log("\n  Nothing matched - the links may already be correct.");
}

if (leftovers.length) {
  console.log("  These lines still look wrong, check them by hand:\n");
  leftovers.slice(0, 40).forEach((m) => console.log("    " + m));
  console.log("");
}
