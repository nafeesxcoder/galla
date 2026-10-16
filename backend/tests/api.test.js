// ===========================================================================
// END TO END API TESTS
// ---------------------------------------------------------------------------
// These run against a REAL MySQL, not a mock. A mock cannot tell you that a
// FOR UPDATE lock works, that a transaction rolled back properly, or that a
// unique index actually refuses a duplicate - which is the half of this
// system most worth testing.
//
//   npm run db:reset && npm test
// ===========================================================================

const app = require("../src/app");
const db = require("../src/db");

const out = [];
let failures = 0;

function chk(label, pass, extra = "") {
  if (!pass) failures++;
  out.push(`${pass ? "PASS" : "FAIL"}  ${label}${extra ? " :: " + extra : ""}`);
}

let base;
let server;

async function api(method, path, { token, businessId, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (businessId) headers["X-Business-Id"] = String(businessId);

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* some responses have no body */
  }
  return { status: res.status, body: json };
}

/** Signs a phone number in and returns its tokens. */
async function signIn(phone) {
  const r1 = await api("POST", "/api/auth/otp/request", { body: { phone } });
  if (!r1.body?.data?.devCode) {
    throw new Error("No devCode in response - is OTP_ECHO on? " + JSON.stringify(r1.body));
  }
  const r2 = await api("POST", "/api/auth/otp/verify", {
    body: { phone, code: r1.body.data.devCode },
  });
  return r2.body.data;
}

async function run() {
  // ---------------------------------------------------------------- health
  let r = await api("GET", "/health");
  chk("health responds", r.status === 200 && r.body.ok === true);

  r = await api("GET", "/health/db");
  chk("database reachable", r.status === 200 && r.body.data === undefined && r.body.ok === true);

  // ----------------------------------------------------------------- plans
  r = await api("GET", "/api/plans");
  chk("plans are public", r.status === 200 && r.body.data.length === 3, `${r.body.data?.length} plans`);
  chk("free plan present", r.body.data.some((p) => p.code === "free"));

  // ------------------------------------------------------------------ auth
  r = await api("POST", "/api/auth/otp/request", { body: { phone: "12345" } });
  chk("bad phone rejected", r.status === 422, `got ${r.status}`);
  chk("  and says which field", Boolean(r.body?.error?.details?.phone));

  r = await api("POST", "/api/auth/otp/request", { body: { phone: "9876500001" } });
  chk("otp requested", r.status === 200 && r.body.data.sent === true);
  const code = r.body.data.devCode;
  chk("dev code returned in development", /^\d{6}$/.test(code ?? ""), String(code));

  r = await api("POST", "/api/auth/otp/verify", {
    body: { phone: "9876500001", code: "000000" },
  });
  chk("wrong code rejected", r.status === 400, `got ${r.status}`);

  r = await api("POST", "/api/auth/otp/verify", {
    body: { phone: "9876500001", code },
  });
  chk("correct code signs in", r.status === 200 && Boolean(r.body.data.accessToken));
  chk("  new user flagged", r.body.data.isNew === true);
  const alice = r.body.data;

  // The same code must not work twice.
  r = await api("POST", "/api/auth/otp/verify", {
    body: { phone: "9876500001", code },
  });
  chk("a used code cannot be reused", r.status === 400, `got ${r.status}`);

  // ---- the OTP is not stored in the clear --------------------------------
  const otpRow = await db("otp_codes").where({ phone: "9876500001" }).orderBy("id", "desc").first();
  chk("otp stored hashed, not in the clear", otpRow && otpRow.code_hash !== code && otpRow.code_hash.startsWith("$2"));

  // ---- me ----------------------------------------------------------------
  r = await api("GET", "/api/auth/me", { token: alice.accessToken });
  chk("me works with a token", r.status === 200 && r.body.data.user.phone === "9876500001");
  chk("  no businesses yet", r.body.data.businesses.length === 0);

  r = await api("GET", "/api/auth/me");
  chk("me refused without a token", r.status === 401);

  r = await api("GET", "/api/auth/me", { token: "rubbish" });
  chk("me refused with a bad token", r.status === 401);

  // A refresh token must not work as an access token.
  r = await api("GET", "/api/auth/me", { token: alice.refreshToken });
  chk("refresh token rejected as access token", r.status === 401);

  // -------------------------------------------------------------- business
  r = await api("POST", "/api/businesses", {
    token: alice.accessToken,
    body: { name: "Sharma Kirana", stateCode: "09", industry: "grocery-store", city: "Noida" },
  });
  chk("business created", r.status === 201 && r.body.data.role === "owner", `got ${r.status}`);
  const biz = r.body.data;
  chk("  state name resolved", biz.stateName === "Uttar Pradesh", String(biz.stateName));

  // GSTIN state must agree with the state field.
  r = await api("POST", "/api/businesses", {
    token: alice.accessToken,
    body: { name: "Mismatch Shop", stateCode: "27", gstin: "09AAACH7409R1ZZ" },
  });
  chk("GSTIN / state mismatch refused", r.status === 400 || r.status === 422, `got ${r.status}`);

  // The free plan should have been attached.
  const sub = await db("subscriptions").where({ business_id: biz.id }).first();
  chk("free plan attached on creation", Boolean(sub) && sub.status === "active");

  // ----------------------------------------------------------------- party
  r = await api("POST", "/api/parties", {
    token: alice.accessToken,
    businessId: biz.id,
    body: { name: "Ramesh Traders", phone: "9876512345", openingBalance: 500 },
  });
  chk("party created", r.status === 201, `got ${r.status}`);
  const party = r.body.data;
  chk("  opening balance becomes the balance", party.balance === 500, String(party.balance));
  chk("  state falls back to the business state", party.stateCode === "09", String(party.stateCode));

  // ----------------------------------------------------------------- items
  r = await api("POST", "/api/items", {
    token: alice.accessToken,
    businessId: biz.id,
    body: { name: "Basmati Rice 5kg", salePrice: 450, taxRate: 5, openingStock: 100, unit: "BAG", lowStockLevel: 10 },
  });
  chk("item created", r.status === 201, `got ${r.status}`);
  const rice = r.body.data;
  chk("  opening stock set", rice.currentStock === 100);

  r = await api("POST", "/api/items", {
    token: alice.accessToken,
    businessId: biz.id,
    body: { name: "Cooking Oil 1L", salePrice: 180, taxRate: 5, openingStock: 50, barcode: "8901234567890" },
  });
  const oil = r.body.data;
  chk("second item created", r.status === 201);

  // A barcode must be unique within the business.
  r = await api("POST", "/api/items", {
    token: alice.accessToken,
    businessId: biz.id,
    body: { name: "Another Oil", salePrice: 100, barcode: "8901234567890" },
  });
  chk("duplicate barcode refused", r.status === 409, `got ${r.status}`);

  // Opening stock should have left a trail.
  const moves = await db("stock_moves").where({ item_id: rice.id });
  chk("opening stock recorded as a move", moves.length === 1 && moves[0].reason === "opening");

  // --------------------------------------------------------------- invoice
  r = await api("POST", "/api/invoices", {
    token: alice.accessToken,
    businessId: biz.id,
    body: {
      docType: "sale",
      partyId: party.id,
      lines: [
        { itemId: rice.id, quantity: 2 },
        { itemId: oil.id, quantity: 3, rate: 175 },
      ],
    },
  });
  chk("invoice created", r.status === 201, `got ${r.status} ${JSON.stringify(r.body?.error ?? "")}`);
  const inv = r.body.data;

  chk("  number has the expected shape", /^INV-\d{4}-\d{2}-0001$/.test(inv.number), inv.number);
  chk("  two lines", inv.lines.length === 2);

  // 2 x 450 = 900, 3 x 175 = 525. Taxable 1425, GST 5% = 71.25.
  chk("  taxable is right", inv.amounts.taxable === 1425, String(inv.amounts.taxable));
  chk("  intra-state so CGST and SGST", inv.amounts.cgst > 0 && inv.amounts.sgst > 0 && inv.amounts.igst === 0);
  chk("  CGST + SGST = total tax", Math.abs(inv.amounts.cgst + inv.amounts.sgst - 71.25) < 0.01,
    `${inv.amounts.cgst}+${inv.amounts.sgst}`);
  chk("  total rounded to a whole rupee", Number.isInteger(inv.amounts.total), String(inv.amounts.total));
  chk("  round-off makes the arithmetic add up",
    Math.abs(inv.amounts.taxable + inv.amounts.cgst + inv.amounts.sgst + inv.amounts.roundOff - inv.amounts.total) < 0.001,
    `${inv.amounts.taxable}+${inv.amounts.cgst}+${inv.amounts.sgst}+${inv.amounts.roundOff} vs ${inv.amounts.total}`);

  // Stock should have moved.
  r = await api("GET", `/api/items/${rice.id}`, { token: alice.accessToken, businessId: biz.id });
  chk("stock came down on the sale", r.body.data.currentStock === 98, String(r.body.data.currentStock));

  // The party now owes more.
  r = await api("GET", `/api/parties/${party.id}`, { token: alice.accessToken, businessId: biz.id });
  chk("party balance went up by the invoice total",
    Math.abs(r.body.data.balance - (500 + inv.amounts.total)) < 0.01,
    `${r.body.data.balance} vs ${500 + inv.amounts.total}`);

  // ---- numbering runs in sequence ----------------------------------------
  r = await api("POST", "/api/invoices", {
    token: alice.accessToken,
    businessId: biz.id,
    body: { docType: "sale", lines: [{ name: "Loose sugar", quantity: 1, rate: 50, taxRate: 5 }] },
  });
  chk("second invoice numbered 0002", r.body.data.number.endsWith("-0002"), r.body.data.number);
  const inv2 = r.body.data;
  chk("  a walk-in needs no party", inv2.party === null);

  // ---- inter-state goes to IGST ------------------------------------------
  r = await api("POST", "/api/parties", {
    token: alice.accessToken,
    businessId: biz.id,
    body: { name: "Mumbai Wholesale", stateCode: "27" },
  });
  const mumbai = r.body.data;

  r = await api("POST", "/api/invoices", {
    token: alice.accessToken,
    businessId: biz.id,
    body: { docType: "sale", partyId: mumbai.id, lines: [{ itemId: rice.id, quantity: 1 }] },
  });
  const interInv = r.body.data;
  chk("inter-state uses IGST", interInv.amounts.igst > 0 && interInv.amounts.cgst === 0,
    `igst=${interInv.amounts.igst} cgst=${interInv.amounts.cgst}`);
  chk("  flagged as inter-state", interInv.isInterState === true);

  // --------------------------------------------------------------- payment
  r = await api("POST", "/api/payments", {
    token: alice.accessToken,
    businessId: biz.id,
    body: {
      direction: "in",
      partyId: party.id,
      amount: 1000,
      mode: "upi",
      allocations: [{ invoiceId: inv.id, amount: 1000 }],
    },
  });
  chk("payment recorded", r.status === 201, `got ${r.status} ${JSON.stringify(r.body?.error ?? "")}`);
  chk("  allocation recorded", r.body.data.allocations.length === 1);

  r = await api("GET", `/api/invoices/${inv.id}`, { token: alice.accessToken, businessId: biz.id });
  chk("invoice marked part paid", r.body.data.status === "partial", r.body.data.status);
  chk("  paid amount right", r.body.data.amounts.paid === 1000, String(r.body.data.amounts.paid));
  chk("  balance reduced", Math.abs(r.body.data.amounts.balance - (inv.amounts.total - 1000)) < 0.01);

  // Over-allocating must be refused.
  r = await api("POST", "/api/payments", {
    token: alice.accessToken,
    businessId: biz.id,
    body: {
      direction: "in",
      partyId: party.id,
      amount: 100000,
      allocations: [{ invoiceId: inv.id, amount: 100000 }],
    },
  });
  chk("paying more than is outstanding refused", r.status === 400, `got ${r.status}`);

  // Settling the rest should mark it paid.
  const rest = inv.amounts.total - 1000;
  r = await api("POST", "/api/payments", {
    token: alice.accessToken,
    businessId: biz.id,
    body: { direction: "in", partyId: party.id, amount: rest, allocations: [{ invoiceId: inv.id, amount: rest }] },
  });
  chk("rest of the money accepted", r.status === 201, `got ${r.status}`);

  r = await api("GET", `/api/invoices/${inv.id}`, { token: alice.accessToken, businessId: biz.id });
  chk("invoice now fully paid", r.body.data.status === "paid", r.body.data.status);
  chk("  nothing outstanding", r.body.data.amounts.balance === 0);

  // ---- cancelling --------------------------------------------------------
  r = await api("POST", `/api/invoices/${inv.id}/cancel`, {
    token: alice.accessToken, businessId: biz.id, body: { reason: "test" },
  });
  chk("a paid invoice cannot simply be cancelled", r.status === 409, `got ${r.status}`);

  const stockBefore = (await api("GET", `/api/items/${rice.id}`, { token: alice.accessToken, businessId: biz.id }))
    .body.data.currentStock;

  r = await api("POST", `/api/invoices/${interInv.id}/cancel`, {
    token: alice.accessToken, businessId: biz.id, body: { reason: "customer changed their mind" },
  });
  chk("unpaid invoice cancels", r.status === 200 && r.body.data.status === "cancelled", `got ${r.status}`);

  const stockAfter = (await api("GET", `/api/items/${rice.id}`, { token: alice.accessToken, businessId: biz.id }))
    .body.data.currentStock;
  chk("cancelling puts the stock back", stockAfter === stockBefore + 1, `${stockBefore} -> ${stockAfter}`);

  // The number must still exist - a gap in the sequence is the thing to avoid.
  const cancelled = await db("invoices").where({ id: interInv.id }).first();
  chk("cancelled invoice keeps its number", Boolean(cancelled) && Boolean(cancelled.number));

  // ------------------------------------------------- one shop cannot see another
  const bob = await signIn("9876500002");
  r = await api("POST", "/api/businesses", {
    token: bob.accessToken,
    body: { name: "Bob Electronics", stateCode: "27" },
  });
  const bobBiz = r.body.data;

  r = await api("GET", "/api/items", { token: bob.accessToken, businessId: biz.id });
  chk("another user cannot read this business", r.status === 404, `got ${r.status}`);

  r = await api("GET", `/api/parties/${party.id}`, { token: bob.accessToken, businessId: bobBiz.id });
  chk("a party id from another business is not found", r.status === 404, `got ${r.status}`);

  r = await api("GET", `/api/invoices/${inv.id}`, { token: bob.accessToken, businessId: bobBiz.id });
  chk("an invoice id from another business is not found", r.status === 404, `got ${r.status}`);

  // Bob's own numbering starts at 1, independent of Alice's.
  r = await api("POST", "/api/items", {
    token: bob.accessToken, businessId: bobBiz.id,
    body: { name: "USB Cable", salePrice: 199, taxRate: 18, openingStock: 20 },
  });
  const cable = r.body.data;
  r = await api("POST", "/api/invoices", {
    token: bob.accessToken, businessId: bobBiz.id,
    body: { docType: "sale", lines: [{ itemId: cable.id, quantity: 1 }] },
  });
  chk("each business numbers from 1", r.body.data.number.endsWith("-0001"), r.body.data.number);

  // ---------------------------------------------------- refresh and rotation
  r = await api("POST", "/api/auth/refresh", { body: { refreshToken: alice.refreshToken } });
  chk("refresh returns a new pair", r.status === 200 && Boolean(r.body.data.accessToken));
  const rotated = r.body.data;
  chk("  the refresh token changed", rotated.refreshToken !== alice.refreshToken);

  // Using the old one again means it leaked. Every session should end.
  r = await api("POST", "/api/auth/refresh", { body: { refreshToken: alice.refreshToken } });
  chk("reusing a rotated token is refused", r.status === 401, `got ${r.status}`);

  r = await api("POST", "/api/auth/refresh", { body: { refreshToken: rotated.refreshToken } });
  chk("  and the replacement is killed too (theft response)", r.status === 401, `got ${r.status}`);

  // ---------------------------------------------------------- stock adjust
  const fresh = await signIn("9876500003");
  r = await api("POST", "/api/businesses", { token: fresh.accessToken, body: { name: "Adjust Co", stateCode: "07" } });
  const fbiz = r.body.data;
  r = await api("POST", "/api/items", {
    token: fresh.accessToken, businessId: fbiz.id,
    body: { name: "Widget", salePrice: 10, openingStock: 5 },
  });
  const widget = r.body.data;

  r = await api("POST", `/api/items/${widget.id}/adjust-stock`, {
    token: fresh.accessToken, businessId: fbiz.id,
    body: { change: -2, reason: "damage", notes: "dropped" },
  });
  chk("stock adjusted down", r.status === 200 && r.body.data.currentStock === 3, JSON.stringify(r.body.data));

  r = await api("GET", `/api/items/${widget.id}/stock-history`, { token: fresh.accessToken, businessId: fbiz.id });
  chk("adjustment appears in the history", r.body.data.some((m) => m.reason === "damage" && m.change === -2));
  chk("  history keeps the running balance", r.body.data[0].balanceAfter === 3, String(r.body.data[0]?.balanceAfter));

  // --------------------------------------------------------------- reports
  r = await api("GET", "/api/invoices/reports/summary", { token: alice.accessToken, businessId: biz.id });
  chk("summary report works", r.status === 200 && Boolean(r.body.data.byType), `got ${r.status}`);

  r = await api("GET", "/api/payments/reports/day-close", { token: alice.accessToken, businessId: biz.id });
  chk("day close works", r.status === 200 && r.body.data.in.upi, JSON.stringify(r.body.data.in));

  // ------------------------------------------------------------ validation
  r = await api("POST", "/api/invoices", {
    token: alice.accessToken, businessId: biz.id, body: { docType: "sale", lines: [] },
  });
  chk("an invoice with no lines is refused", r.status === 422, `got ${r.status}`);

  r = await api("POST", "/api/invoices", {
    token: alice.accessToken, businessId: biz.id,
    body: { docType: "sale", lines: [{ itemId: rice.id, quantity: -5 }] },
  });
  chk("negative quantity refused", r.status === 422, `got ${r.status}`);

  r = await api("POST", "/api/items", {
    token: alice.accessToken, businessId: biz.id,
    body: { name: "Bad tax", salePrice: 10, taxRate: 150 },
  });
  chk("tax rate over 100 refused", r.status === 422, `got ${r.status}`);

  r = await api("GET", "/api/items", { token: alice.accessToken });
  chk("business header is required", r.status === 400, `got ${r.status}`);

  r = await api("GET", "/api/nope", { token: alice.accessToken });
  chk("unknown route is a clean 404", r.status === 404 && r.body.error.code === "not_found");

  // ------------------------------------------------------------- listing
  r = await api("GET", "/api/invoices?docType=sale&limit=10", { token: alice.accessToken, businessId: biz.id });
  chk("invoice list works", r.status === 200 && Array.isArray(r.body.data));
  chk("  and totals the money", typeof r.body.meta.sumTotal === "number", JSON.stringify(r.body.meta));

  r = await api("GET", "/api/items?lowStock=true", { token: alice.accessToken, businessId: biz.id });
  chk("low stock filter works", r.status === 200);

  r = await api("GET", "/api/parties?owing=true", { token: alice.accessToken, businessId: biz.id });
  chk("owing filter works", r.status === 200 && r.body.data.every((p) => p.balance > 0));
}

// ---------------------------------------------------------------------------
(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;

  try {
    await run();
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
