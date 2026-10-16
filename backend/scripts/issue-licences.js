#!/usr/bin/env node
// ===========================================================================
// ISSUING LICENCE KEYS
// ---------------------------------------------------------------------------
//   node scripts/issue-licences.js --plan silver --count 10
//   node scripts/issue-licences.js --plan gold --count 1 --to "Ravi Traders"
//   node scripts/issue-licences.js --plan silver --count 5 --months 24 --csv
//
// A COMMAND, not an endpoint, and on purpose. Minting licences is minting
// money: there is no admin role in this system yet, so an HTTP route to do
// it would be guarded by nothing but a flag somebody could forget to set.
// A script needs a shell on your server, which is a far better lock than
// anything this codebase could offer today.
//
// Keys are stored in full rather than hashed, unlike a password: a
// shopkeeper will lose theirs and ring support, and support has to be able
// to read it back. That makes the database rows worth as much as the keys
// are, so keep the printed output - and the database - the way you would
// keep cash.
// ===========================================================================

require("dotenv").config();

const db = require("../src/db");
const licence = require("../src/modules/account/licence");

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  if (!v || v.startsWith("--")) return true; // a bare flag
  return v;
}

async function main() {
  const planCode = arg("plan");
  const count = Number(arg("count", 1));
  const issuedTo = arg("to", null);
  const monthsArg = arg("months", null);
  const asCsv = arg("csv", false) === true;

  if (!planCode || planCode === true) {
    console.error("Which plan? --plan silver");
    const plans = await db("plans").select("code", "name", "period_months").orderBy("sort_order");
    console.error("\nPlans you have:");
    for (const p of plans) console.error(`  ${p.code.padEnd(10)} ${p.name} (${p.period_months} months)`);
    process.exit(1);
  }

  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    console.error("--count must be between 1 and 1000.");
    process.exit(1);
  }

  const plan = await db("plans").where({ code: String(planCode) }).first();
  if (!plan) {
    console.error(`No plan with code "${planCode}".`);
    process.exit(1);
  }

  const months = monthsArg && monthsArg !== true ? Number(monthsArg) : Number(plan.period_months);
  if (!Number.isInteger(months) || months < 1 || months > 240) {
    console.error("--months must be between 1 and 240.");
    process.exit(1);
  }

  const codes = [];
  // One insert per key rather than a batch, so that the astronomically
  // unlikely duplicate costs one retry instead of the whole batch.
  for (let i = 0; i < count; i++) {
    let inserted = false;
    for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
      const code = licence.generateCode();
      try {
        await db("licences").insert({
          code,
          plan_id: plan.id,
          period_months: months,
          status: "issued",
          issued_to: issuedTo && issuedTo !== true ? String(issuedTo).slice(0, 160) : null,
        });
        codes.push(code);
        inserted = true;
      } catch (e) {
        // A clash on the unique index is the only error worth retrying.
        if (!/duplicate|unique/i.test(e.message)) throw e;
      }
    }
    if (!inserted) throw new Error("could not generate a key that was not already taken");
  }

  if (asCsv) {
    console.log("code,plan,months,issued_to");
    for (const c of codes) console.log(`${c},${plan.code},${months},${issuedTo === true ? "" : issuedTo || ""}`);
  } else {
    console.log(`\n${codes.length} key${codes.length === 1 ? "" : "s"} for ${plan.name} (${months} months)`);
    if (issuedTo && issuedTo !== true) console.log(`issued to: ${issuedTo}`);
    console.log("");
    for (const c of codes) console.log(`  ${c}`);
    console.log("\nThese are printed once. Save them.\n");
  }

  await db.destroy();
}

main().catch(async (e) => {
  console.error(e.message);
  await db.destroy().catch(() => {});
  process.exit(1);
});
