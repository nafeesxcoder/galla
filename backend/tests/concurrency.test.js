// ===========================================================================
// CONCURRENCY
// ---------------------------------------------------------------------------
// The claims this file checks are the ones a mocked database cannot:
//
//   1. Two tills billing at the same instant never get the same number.
//      GST wants an unbroken sequence with no duplicates, and MAX(number)+1
//      quietly breaks under load.
//
//   2. Two simultaneous sales of the same item both come off the stock.
//      A read-modify-write without a lock loses one of them.
//
//   3. A failure part way through an invoice rolls EVERYTHING back - no
//      stock taken out for a sale that was never recorded.
// ===========================================================================

const app = require("../src/app");
const db = require("../src/db");
const invoiceService = require("../src/modules/invoices/service");

const out = [];
let failures = 0;
const chk = (l, p, x = "") => { if (!p) failures++; out.push(`${p ? "PASS" : "FAIL"}  ${l}${x ? " :: " + x : ""}`); };

let base, server;
async function api(method, path, { token, businessId, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (businessId) headers["X-Business-Id"] = String(businessId);
  const res = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function signIn(phone) {
  const r1 = await api("POST", "/api/auth/otp/request", { body: { phone } });
  const r2 = await api("POST", "/api/auth/otp/verify", { body: { phone, code: r1.body.data.devCode } });
  return r2.body.data;
}

(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;

  try {
    const user = await signIn("9876600001");
    const biz = (await api("POST", "/api/businesses", {
      token: user.accessToken, body: { name: "Race Test Shop", stateCode: "09" },
    })).body.data;

    const item = (await api("POST", "/api/items", {
      token: user.accessToken, businessId: biz.id,
      body: { name: "Counter Item", salePrice: 100, taxRate: 18, openingStock: 1000 },
    })).body.data;

    // ---- 1. twenty bills at the same moment ----------------------------
    const N = 20;
    const results = await Promise.all(
      Array.from({ length: N }, () =>
        api("POST", "/api/invoices", {
          token: user.accessToken, businessId: biz.id,
          body: { docType: "sale", lines: [{ itemId: item.id, quantity: 1 }] },
        })
      )
    );

    const created = results.filter((r) => r.status === 201);
    chk(`all ${N} concurrent bills succeeded`, created.length === N,
      `${created.length}/${N}, statuses: ${[...new Set(results.map(r=>r.status))].join(",")}`);

    const numbers = created.map((r) => r.body.data.number);
    const unique = new Set(numbers);
    chk("every invoice number is unique", unique.size === numbers.length,
      `${unique.size} unique out of ${numbers.length}`);

    const serials = created.map((r) => r.body.data.serial).sort((a, b) => a - b);
    const gapless = serials.every((s, i) => s === serials[0] + i);
    chk("the sequence has no gaps", gapless, `${serials[0]}..${serials[serials.length - 1]}`);

    // ---- 2. the stock is right -----------------------------------------
    const after = (await api("GET", `/api/items/${item.id}`, { token: user.accessToken, businessId: biz.id })).body.data;
    chk("every sale came off the stock", after.currentStock === 1000 - N,
      `expected ${1000 - N}, got ${after.currentStock}`);

    const moveCount = await db("stock_moves")
      .where({ item_id: item.id, reason: "sale" }).count({ c: "*" }).first();
    chk("one stock move per sale", Number(moveCount.c) === N, `${moveCount.c} moves`);

    // The running balance on the moves must be a clean descending run with
    // no two moves claiming the same "after" figure.
    const balances = (await db("stock_moves")
      .where({ item_id: item.id, reason: "sale" })
      .orderBy("id", "asc").pluck("balance_after")).map(Number);
    chk("running balances are distinct and descending",
      new Set(balances).size === balances.length && balances.every((b, i) => i === 0 || b < balances[i - 1]),
      balances.slice(0, 5).join(",") + "...");

    // ---- 3. a failure rolls the whole thing back ------------------------
    const stockBefore = (await api("GET", `/api/items/${item.id}`, { token: user.accessToken, businessId: biz.id }))
      .body.data.currentStock;
    const invCountBefore = Number((await db("invoices").where({ business_id: biz.id }).count({ c: "*" }).first()).c);

    // Second line points at an item that does not exist, so the whole
    // invoice must fail - including the first line's stock movement.
    const bad = await api("POST", "/api/invoices", {
      token: user.accessToken, businessId: biz.id,
      body: {
        docType: "sale",
        lines: [
          { itemId: item.id, quantity: 5 },
          { itemId: 99999999, quantity: 1 },
        ],
      },
    });
    chk("an invoice with a bad line is refused", bad.status === 400, `got ${bad.status}`);

    const stockAfterFail = (await api("GET", `/api/items/${item.id}`, { token: user.accessToken, businessId: biz.id }))
      .body.data.currentStock;
    chk("no stock was taken by the failed invoice", stockAfterFail === stockBefore,
      `${stockBefore} -> ${stockAfterFail}`);

    const invCountAfter = Number((await db("invoices").where({ business_id: biz.id }).count({ c: "*" }).first()).c);
    chk("no half-written invoice left behind", invCountAfter === invCountBefore,
      `${invCountBefore} -> ${invCountAfter}`);

    // ---- 4. the counter survives the failed attempt ---------------------
    // A rolled-back transaction gives the number back, so the next real
    // invoice continues the run rather than leaving a hole.
    const next = await api("POST", "/api/invoices", {
      token: user.accessToken, businessId: biz.id,
      body: { docType: "sale", lines: [{ itemId: item.id, quantity: 1 }] },
    });
    chk("numbering continues after a failed attempt",
      next.body.data.serial === serials[serials.length - 1] + 1,
      `got ${next.body.data.serial}, last good was ${serials[serials.length - 1]}`);

    // ---- 5. concurrent payments on one invoice --------------------------
    const target = next.body.data;
    const half = target.amounts.total / 2;
    const pays = await Promise.all([
      api("POST", "/api/payments", {
        token: user.accessToken, businessId: biz.id,
        body: { direction: "in", amount: half, allocations: [{ invoiceId: target.id, amount: half }] },
      }),
      api("POST", "/api/payments", {
        token: user.accessToken, businessId: biz.id,
        body: { direction: "in", amount: half, allocations: [{ invoiceId: target.id, amount: half }] },
      }),
    ]);
    chk("both halves accepted", pays.every((p) => p.status === 201),
      pays.map((p) => p.status).join(","));

    const paid = (await api("GET", `/api/invoices/${target.id}`, { token: user.accessToken, businessId: biz.id })).body.data;
    chk("paid never exceeds the total", paid.amounts.paid <= paid.amounts.total,
      `${paid.amounts.paid} of ${paid.amounts.total}`);
    chk("invoice settled exactly", paid.amounts.balance === 0 && paid.status === "paid",
      `${paid.status}, balance ${paid.amounts.balance}`);

    // ---- 6. the financial year boundary ---------------------------------
    chk("31 March is the old year", invoiceService.financialYear("2027-03-31", 4) === "2026-27",
      invoiceService.financialYear("2027-03-31", 4));
    chk("1 April is the new year", invoiceService.financialYear("2027-04-01", 4) === "2027-28",
      invoiceService.financialYear("2027-04-01", 4));
    chk("January belongs to the year that started last April",
      invoiceService.financialYear("2027-01-15", 4) === "2026-27",
      invoiceService.financialYear("2027-01-15", 4));
  } catch (e) {
    failures++;
    out.push(`FAIL  threw: ${e.message}`);
    console.error(e);
  }

  console.log(out.join("\n"));
  console.log(`\nFAILURES: ${failures} / ${out.length}`);
  server.close();
  await db.destroy();
  process.exit(failures ? 1 : 0);
})();
