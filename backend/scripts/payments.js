#!/usr/bin/env node
// ===========================================================================
// THE PAYMENTS QUEUE
// ---------------------------------------------------------------------------
//   node scripts/payments.js                      who is waiting, and on what
//   node scripts/payments.js --all                including finished ones
//   node scripts/payments.js --approve MGB-7-K2M4X
//   node scripts/payments.js --reject  MGB-7-K2M4X --why "not in our bank"
//
// WHY THIS EXISTS
// ---------------
// Money arrives by UPI and bank transfer, straight into your account.
// Nothing tells the server. The customer types in a transaction number and -
// if PAYMENT_AUTO_APPROVE is on - their plan starts that second, against a
// claim nobody has checked.
//
// This is where it gets checked. Open your bank app, open this, and make
// them agree. A row listed as "PLAN ALREADY ON - not yet verified" is money
// you have not seen yet.
//
// READ THIS IF YOU DO NOTHING ELSE
// --------------------------------
// Running this daily is the whole safety net. Twelve digits typed into a
// form is not a payment, and the gap between a claim and your bank statement
// is exactly how long somebody gets a plan for free.
// ===========================================================================

require("dotenv").config();

const readline = require("node:readline/promises");
const db = require("../src/db");
const config = require("../src/config");
const { applyPlan, revokePlan } = require("../src/modules/account/activate");

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

/** Paise to a readable "₹3,999" without the float rounding. */
function rupees(paise) {
  const n = Number(paise || 0) / 100;
  return "Rs " + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/** "12 October 2027" - never 12/10/27, which is read two ways. */
function longDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ago(d) {
  if (!d) return "";
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} days ago`;
}

async function findRow(reference) {
  return db("payment_requests as pr")
    .join("plans as p", "p.id", "pr.plan_id")
    .join("users as u", "u.id", "pr.user_id")
    .leftJoin("businesses as b", "b.id", "pr.business_id")
    .where("pr.reference", reference.trim().toUpperCase())
    .select(
      "pr.*",
      "p.name as plan_name",
      "p.code as plan_code",
      "p.period_months as plan_period_months",
      "u.name as user_name",
      "u.phone as user_phone",
      "b.name as business_name"
    )
    .first();
}

function printRow(r, { full = false } = {}) {
  const who = `${r.user_name || "(no name set)"}  +91 ${r.user_phone}`;
  const what = `${r.plan_name}, ${r.device}, ${r.period_months} months${
    Number(r.quantity) > 1 ? ` x${r.quantity}` : ""
  }`;

  console.log("");
  console.log(`  ${r.reference}    ${rupees(r.amount_paise)}`);
  console.log(`      ${who}`);
  console.log(`      ${what}`);
  console.log(`      shop: ${r.business_name || "(none chosen yet)"}`);
  console.log(`      quoted ${ago(r.created_at)}`);

  if (r.utr) console.log(`      UTR they gave: ${r.utr}   (${ago(r.claimed_at)})`);
  if (r.payer_note) console.log(`      they say: ${r.payer_note}`);

  if (r.status === "claimed" && r.auto_approved) {
    // The line that matters. Said plainly, because skim-reading this list is
    // exactly how an unverified payment stays unverified for a month.
    console.log(`      >> PLAN IS ALREADY ON - nobody has checked the bank yet`);
  } else if (r.status === "claimed") {
    console.log(`      >> waiting for you - plan is NOT on`);
  } else if (r.status === "pending") {
    console.log(`      .. quoted only, they have not said they paid`);
  } else if (r.status === "approved") {
    console.log(`      ok  approved ${longDate(r.decided_at)}`);
  } else if (r.status === "rejected") {
    console.log(`      xx  rejected ${longDate(r.decided_at)}${r.decision_note ? ` - ${r.decision_note}` : ""}`);
  }

  if (full && r.subscription_id) console.log(`      subscription #${r.subscription_id}`);
}

async function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`${question} (yes/no) `)).trim().toLowerCase();
  rl.close();
  return answer === "yes" || answer === "y";
}

// ---------------------------------------------------------------------------
async function list(all) {
  const q = db("payment_requests as pr")
    .join("plans as p", "p.id", "pr.plan_id")
    .join("users as u", "u.id", "pr.user_id")
    .leftJoin("businesses as b", "b.id", "pr.business_id")
    .select(
      "pr.*",
      "p.name as plan_name",
      "p.code as plan_code",
      "u.name as user_name",
      "u.phone as user_phone",
      "b.name as business_name"
    )
    .orderBy("pr.id", "desc")
    .limit(all ? 100 : 50);

  if (!all) q.whereIn("pr.status", ["claimed", "pending"]);

  const rows = await q;

  // Unverified claims first: they are the ones costing you money right now.
  const claimed = rows.filter((r) => r.status === "claimed");
  const pending = rows.filter((r) => r.status === "pending");
  const done = rows.filter((r) => r.status === "approved" || r.status === "rejected");

  console.log("");
  console.log("  PAYMENTS");
  console.log("  " + "=".repeat(62));
  console.log(
    `  Auto-approve is ${config.payments.autoApprove ? "ON" : "OFF"} - a claim ${
      config.payments.autoApprove ? "starts the plan immediately" : "waits for you"
    }.`
  );

  if (claimed.length) {
    console.log("");
    console.log(`  SAY THEY HAVE PAID (${claimed.length}) - check these against your bank`);
    console.log("  " + "-".repeat(62));
    claimed.forEach((r) => printRow(r));
  } else {
    console.log("");
    console.log("  Nothing waiting to be checked.");
  }

  if (pending.length) {
    console.log("");
    console.log(`  QUOTED BUT NOT PAID (${pending.length}) - nothing to do, they are just looking`);
    console.log("  " + "-".repeat(62));
    pending.forEach((r) => printRow(r));
  }

  if (all && done.length) {
    console.log("");
    console.log(`  FINISHED (${done.length})`);
    console.log("  " + "-".repeat(62));
    done.forEach((r) => printRow(r, { full: true }));
  }

  if (claimed.length) {
    console.log("");
    console.log("  " + "-".repeat(62));
    console.log("  Found the money in your bank?");
    console.log(`      node scripts/payments.js --approve ${claimed[0].reference}`);
    console.log("  Not there?");
    console.log(`      node scripts/payments.js --reject ${claimed[0].reference} --why "not in our bank"`);
  }
  console.log("");
}

// ---------------------------------------------------------------------------
async function approve(reference, yes) {
  const r = await findRow(reference);
  if (!r) {
    console.error(`No payment with the reference ${reference}.`);
    process.exit(1);
  }
  if (r.status === "approved") {
    console.log(`${r.reference} was already approved on ${longDate(r.decided_at)}. Nothing to do.`);
    return;
  }
  if (r.status === "rejected") {
    console.error(`${r.reference} was rejected on ${longDate(r.decided_at)}. Approving it now would`);
    console.error("be a second decision on the same money - start a new payment instead.");
    process.exit(1);
  }

  printRow(r, { full: true });
  console.log("");

  if (r.auto_approved && r.subscription_id) {
    console.log("  The plan is already on. Approving only records that you have now seen");
    console.log("  the money in your bank.");
  } else if (Number(r.quantity) > 1) {
    console.log(`  ${r.quantity} licences. This does NOT start a plan - issue the keys with`);
    console.log("      node scripts/issue-licences.js");
    console.log("  Approving here just closes the payment off.");
  } else if (!r.business_id) {
    console.error("  This payment is not attached to a shop, so there is nowhere to put a plan.");
    console.error("  Ask them to choose a shop on the site, or use:");
    console.error(`      node scripts/activate-plan.js --phone ${r.user_phone} --plan ${r.plan_code}`);
    process.exit(1);
  } else {
    console.log(`  This will START the plan on "${r.business_name}".`);
  }

  console.log("");
  if (!yes && !(await confirm(`  Approve ${r.reference} for ${rupees(r.amount_paise)}?`))) {
    console.log("  Nothing changed.");
    return;
  }

  const result = await db.transaction(async (trx) => {
    const patch = { status: "approved", decided_at: new Date(), updated_at: trx.fn.now() };

    // Only start a plan if one is not already running from the auto-approve,
    // and only for a single licence.
    const needsPlan = !r.subscription_id && Number(r.quantity) === 1 && r.business_id;
    let applied = null;

    if (needsPlan) {
      const plan = await trx("plans").where({ id: r.plan_id }).first();
      applied = await applyPlan({
        trx,
        businessId: r.business_id,
        plan,
        months: Number(r.period_months) || undefined,
        reference: `payment:${r.reference}`,
        amountPaise: Number(r.amount_paise),
      });
      patch.subscription_id = applied.subscriptionId;
      patch.replaced_subscription_id = applied.replacedSubscriptionId;
    }

    await trx("payment_requests").where({ id: r.id }).update(patch);
    return applied;
  });

  console.log("");
  if (result) {
    console.log(`  Done. ${r.plan_name} on "${r.business_name}" until ${longDate(result.expiresAt)}.`);
    if (result.extended) console.log("  (Their remaining days were kept and added to.)");
  } else {
    console.log("  Done. Payment marked as seen.");
  }
  console.log("");
}

// ---------------------------------------------------------------------------
async function reject(reference, why, yes) {
  const r = await findRow(reference);
  if (!r) {
    console.error(`No payment with the reference ${reference}.`);
    process.exit(1);
  }
  if (r.status === "rejected") {
    console.log(`${r.reference} was already rejected on ${longDate(r.decided_at)}. Nothing to do.`);
    return;
  }

  printRow(r, { full: true });
  console.log("");

  if (r.subscription_id) {
    console.log(`  This will TAKE THE PLAN BACK OFF "${r.business_name}".`);
    if (r.replaced_subscription_id) {
      console.log("  Whatever they were on before will be put back.");
    }
    console.log("");
    console.log("  Be sure. Search your bank for the UTR above before you do this - a");
    console.log("  payment that really arrived and gets rejected is a customer who paid");
    console.log("  you and lost their software.");
  } else {
    console.log("  No plan was started, so this only closes the payment off.");
  }

  console.log("");
  if (!yes && !(await confirm(`  Reject ${r.reference}?`))) {
    console.log("  Nothing changed.");
    return;
  }

  const restored = await db.transaction(async (trx) => {
    let out = { restored: false };
    if (r.subscription_id) {
      out = await revokePlan({
        trx,
        subscriptionId: r.subscription_id,
        replacedSubscriptionId: r.replaced_subscription_id,
      });
    }
    await trx("payment_requests").where({ id: r.id }).update({
      status: "rejected",
      decided_at: new Date(),
      decision_note: why || null,
      updated_at: trx.fn.now(),
    });
    return out;
  });

  console.log("");
  console.log(`  Rejected.${r.subscription_id ? " The plan has been taken off." : ""}`);
  if (restored.restored) {
    console.log(`  Their previous plan is back, running to ${longDate(restored.endsAt)}.`);
  }
  console.log(`  Ring them on +91 ${r.user_phone} - somebody who thinks they have paid`);
  console.log("  deserves to hear why their software stopped from you, not from a screen.");
  console.log("");
}

// ---------------------------------------------------------------------------
async function main() {
  const approveRef = str(arg("approve"));
  const rejectRef = str(arg("reject"));
  const why = str(arg("why"));
  const yes = arg("yes", false) === true;
  const all = arg("all", false) === true;

  if (approveRef && rejectRef) {
    console.error("Pick one: --approve or --reject.");
    process.exit(1);
  }

  if (approveRef) return approve(approveRef, yes);
  if (rejectRef) return reject(rejectRef, why, yes);
  return list(all);
}

main()
  .then(() => db.destroy())
  .catch(async (e) => {
    console.error("");
    console.error(e.message || e);
    console.error("");
    await db.destroy();
    process.exit(1);
  });
