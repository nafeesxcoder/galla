#!/usr/bin/env node
// ===========================================================================
// TURNING SOMEBODY'S PLAN ON, AFTER THEY HAVE PAID
// ---------------------------------------------------------------------------
//   node scripts/activate-plan.js --phone 9876543210 --plan silver
//   node scripts/activate-plan.js --phone 9876543210 --plan gold --ref "NEFT 884213" --amount 4999
//   node scripts/activate-plan.js --phone 9876543210 --plan silver --months 24
//   node scripts/activate-plan.js --phone 9876543210          (just show me what they have)
//
// This is the offline path: the money lands in your bank, you see it, you
// run this. No licence key is involved, because none is needed - you already
// know whose payment it is.
//
// Keys are for the case where you CANNOT know: a dealer who sells for you
// has no access to this server, so he hands over a key instead and the
// customer attaches it himself.
//
// WHAT IT SHOWS BEFORE IT DOES ANYTHING
// -------------------------------------
// The phone number, the name, the shop, the plan they are on now and the
// plan they will be on. Then it asks. Activating the wrong shop is a free
// year for a stranger, and the number is typed by hand from a bank
// statement - so it is read back before anything is written.
// ===========================================================================

require("dotenv").config();

const readline = require("node:readline/promises");
const db = require("../src/db");
const { applyPlan } = require("../src/modules/account/activate");

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  if (!v || v.startsWith("--")) return true;
  return v;
}

function str(v) {
  return v && v !== true ? String(v) : null;
}

/** "12 October 2027" - never 12/10/27, which is read two ways. */
function longDate(d) {
  if (!d) return "no end date";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

async function main() {
  const phoneArg = str(arg("phone"));
  const planCode = str(arg("plan"));
  const monthsArg = str(arg("months"));
  const reference = str(arg("ref"));
  const amountRupees = str(arg("amount"));
  const businessArg = str(arg("business"));
  const yes = arg("yes", false) === true;

  if (!phoneArg) {
    console.error("Whose plan? --phone 9876543210");
    console.error("");
    console.error("  node scripts/activate-plan.js --phone 9876543210 --plan silver --ref \"NEFT 884213\"");
    process.exit(1);
  }

  // Typed off a bank statement, so spaces, dashes and a +91 are all likely.
  const phone = phoneArg.replace(/[^0-9]/g, "").slice(-10);
  if (phone.length !== 10) {
    console.error(`"${phoneArg}" is not a 10-digit mobile number.`);
    process.exit(1);
  }

  const user = await db("users").where({ phone }).first();
  if (!user) {
    console.error(`No account with the number ${phone}.`);
    console.error("They have to sign in to the app or the website once before a plan can go on it.");
    process.exit(1);
  }

  // Only shops they OWN. Being staff somewhere does not make that shop
  // theirs to buy a plan for.
  const shops = await db("business_members as m")
    .join("businesses as b", "b.id", "m.business_id")
    .where({ "m.user_id": user.id, "m.role": "owner", "m.is_active": true })
    .whereNull("b.deleted_at")
    .select("b.id", "b.name")
    .orderBy("b.id");

  if (shops.length === 0) {
    console.error(`${user.name || phone} has an account but owns no shop yet.`);
    console.error("Ask them to finish setting up their business first.");
    process.exit(1);
  }

  // What they are on now.
  const current = await db("subscriptions as s")
    .join("plans as p", "p.id", "s.plan_id")
    .whereIn("s.business_id", shops.map((b) => b.id))
    .whereIn("s.status", ["trial", "active"])
    .select("s.business_id", "s.ends_at", "s.status", "p.name as plan_name")
    .orderBy("s.id", "desc");

  const nowOn = new Map();
  for (const row of current) if (!nowOn.has(Number(row.business_id))) nowOn.set(Number(row.business_id), row);

  console.log("");
  console.log(`  ${user.name || "(no name set)"}   ${user.dial_code || "+91"} ${phone}`);
  console.log("  " + "-".repeat(52));
  for (const s of shops) {
    const on = nowOn.get(Number(s.id));
    const line = on ? `${on.plan_name}, until ${longDate(on.ends_at)}` : "no plan";
    console.log(`  [${s.id}]  ${s.name}  -  ${line}`);
  }
  console.log("");

  // No --plan: this was a lookup, not an activation. Stop here.
  if (!planCode) {
    console.log("  Nothing changed. Add --plan silver (or gold) to turn one on.");
    console.log("");
    await db.destroy();
    return;
  }

  // Which shop. Asked rather than assumed when there is more than one,
  // because a year of Gold on the wrong shop cannot be taken back by them.
  let shop;
  if (businessArg) {
    shop = shops.find((s) => String(s.id) === String(businessArg));
    if (!shop) {
      console.error(`  They do not own a shop with id ${businessArg}.`);
      process.exit(1);
    }
  } else if (shops.length === 1) {
    shop = shops[0];
  } else {
    console.error("  They own more than one shop. Say which: --business <id>");
    process.exit(1);
  }

  const plan = await db("plans").where({ code: planCode }).first();
  if (!plan) {
    const all = await db("plans").select("code").orderBy("sort_order");
    console.error(`  No plan with code "${planCode}". You have: ${all.map((p) => p.code).join(", ")}`);
    process.exit(1);
  }

  const months = monthsArg ? Number(monthsArg) : Number(plan.period_months);
  if (!Number.isInteger(months) || months < 1 || months > 240) {
    console.error("  --months must be a whole number between 1 and 240.");
    process.exit(1);
  }

  const amountPaise = amountRupees ? Math.round(Number(amountRupees) * 100) : 0;
  if (amountRupees && !Number.isFinite(amountPaise)) {
    console.error("  --amount should be rupees, like --amount 4999");
    process.exit(1);
  }

  const on = nowOn.get(Number(shop.id));
  const willExtend = on && on.status === "active" && on.ends_at && new Date(on.ends_at) > new Date();

  console.log(`  About to put ${shop.name} on ${plan.name} for ${months} months.`);
  if (willExtend) {
    console.log(`  It runs until ${longDate(on.ends_at)} today, so the months are ADDED to that.`);
  }
  if (reference) console.log(`  Reference: ${reference}`);
  if (amountPaise) console.log(`  Recording ₹${(amountPaise / 100).toLocaleString("en-IN")} received.`);
  else console.log("  No amount recorded. Pass --amount 4999 if you want it in the books.");
  console.log("");

  if (!yes) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question("  Go ahead? (yes/no) ");
    rl.close();
    if (!/^y(es)?$/i.test(answer.trim())) {
      console.log("\n  Nothing changed.\n");
      await db.destroy();
      return;
    }
  }

  const result = await db.transaction((trx) =>
    applyPlan({
      trx,
      businessId: shop.id,
      plan,
      months,
      reference: reference || `offline:${new Date().toISOString().slice(0, 10)}`,
      amountPaise,
    })
  );

  console.log("");
  console.log(`  Done. ${shop.name} is on ${plan.name}${result.extended ? " - extended" : ""}.`);
  console.log(`  Runs until ${longDate(result.expiresAt)}.`);
  console.log("");
  console.log("  They will see it the next time the app or the website loads.");
  console.log("  Nothing is sent to them automatically - tell them yourself.");
  console.log("");

  await db.destroy();
}

main().catch(async (e) => {
  console.error(e.message);
  await db.destroy().catch(() => {});
  process.exit(1);
});
