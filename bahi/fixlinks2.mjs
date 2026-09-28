#!/usr/bin/env node
/* ===========================================================================
   GALLA - fix the footer legal links  (version 2)
   ---------------------------------------------------------------------------
   Run from the project root:

       node fixlinks2.mjs

   Repoints links whose label mentions one of these, but whose href is wrong:

       Contact  ->  /contact
       Terms    ->  /terms
       Privacy  ->  /privacy
       Refund   ->  /refund

   Version 2 also handles links written directly as JSX, including the case
   where the tag is spread over several lines:

       <Link href="/about">Terms</Link>
       <a href="/about" className="x">Privacy policy</a>
       <Link href="/about">
         Refund policy
       </Link>

   If it still cannot find them, it prints a REPORT of every relevant line so
   you can paste that back and get an exact fix.

   Real "About Us" links are never touched. Changed files are backed up .bak.
   =========================================================================== */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

if (!fs.existsSync(path.join(root, "package.json"))) {
  console.error("\n  Stop - this does not look like the project root.\n");
  process.exit(1);
}

const MAP = [
  ["Contact", "/contact"],
  ["Terms", "/terms"],
  ["Privacy", "/privacy"],
  ["Refund", "/refund"],
  ["Cancellation", "/refund"],
];

const BAD = "(?:/about(?:-us)?|#|)";
const Q = `["'\`]`;

function rulesFor(word, to) {
  const L = `${Q}\\s*[^"'\`]*${word}[^"'\`]*${Q}`;
  return [
    // ---- data shapes ----
    [new RegExp(`(${L}\\s*,\\s*${Q})${BAD}(${Q})`, "gi"), `$1${to}$2`],
    [new RegExp(`((?:label|name|title|text)\\s*:\\s*${L}[^}]*?(?:href|url|to|link|path)\\s*:\\s*${Q})${BAD}(${Q})`, "gi"), `$1${to}$2`],
    [new RegExp(`((?:href|url|to|link|path)\\s*:\\s*${Q})${BAD}(${Q}[^}]*?(?:label|name|title|text)\\s*:\\s*${L})`, "gi"), `$1${to}$2`],
    [new RegExp(`(${L}\\s*:\\s*${Q})${BAD}(${Q})`, "gi"), `$1${to}$2`],

    // ---- JSX, label inside the tag, possibly across lines ----
    // <Link href="/about" ...>  ...Terms...  </Link>
    [
      new RegExp(
        // [^<] keeps the match inside this tag's own text, so it can never
        // run past </Link> and pick up the next link's label
        `(<(?:Link|a)\\b[^>]*?href=\\{?${Q})${BAD}(${Q}\\}?[^>]*>[^<]{0,140}?${word})`,
        "gi"
      ),
      `$1${to}$2`,
    ],
  ];
}

const DIRS = ["lib", "components", "app", "data", "config", "src"];
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

const files = [...new Set(DIRS.flatMap((d) => walk(path.join(root, d))))];
let changed = 0;
const report = [];

for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  const hasWord = MAP.some(([w]) => new RegExp(w, "i").test(before));
  if (!hasWord) continue;

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
    const b = after.split("\n");
    a.forEach((line, i) => {
      if (b[i] !== line) {
        console.log("          - " + line.trim());
        console.log("          + " + b[i].trim());
      }
    });
    changed++;
  } else {
    // collect anything that still looks like one of these links
    const lines = before.split("\n");
    lines.forEach((line, i) => {
      const w = MAP.find(([x]) => new RegExp(x, "i").test(line));
      const nearby = lines.slice(Math.max(0, i - 2), i + 3).join(" ");
      if (w && /\/about|href|"#"/.test(nearby)) {
        report.push(`${rel}:${i + 1}  ${line.trim().slice(0, 110)}`);
      }
    });
  }
}

if (changed) {
  console.log("\n  Done - " + changed + " file(s) updated. Restart npm run dev.\n");
} else {
  console.log("\n  Could not match anything automatically.");
}

if (report.length) {
  console.log("\n  ---------- REPORT: copy everything below and send it ----------\n");
  report.slice(0, 60).forEach((m) => console.log("  " + m));
  console.log("\n  ---------------------------------------------------------------\n");
}
