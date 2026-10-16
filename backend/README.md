# Galla backend

The API behind the billing app. Node + Express + MySQL, with the schema
written as migrations.

The brand name is still being decided. It appears here in a handful of
places only — `package.json`, the database name, and the seed file — so
renaming later is a find-and-replace, not a rewrite.

---

## Getting it running

```bash
cd backend
npm install
cp .env.example .env     # then fill in DB_PASSWORD and JWT_SECRET
```

Create the database first — the migrations create tables, not the database
itself:

```sql
CREATE DATABASE galla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'galla'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON galla.* TO 'galla'@'%';
```

Then:

```bash
npm run migrate      # creates the 18 tables
npm run seed         # inserts the three plans
npm run dev          # http://localhost:4000
```

Check it:

```bash
curl http://localhost:4000/health/db
```

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start with auto-reload |
| `npm start` | Start for production |
| `npm run migrate` | Apply any migrations not yet run |
| `npm run migrate:rollback` | Undo the last batch |
| `npm run migrate:make <name>` | Create a new migration file |
| `npm run migrate:status` | What has run and what has not |
| `npm run seed` | Insert the plans |
| `npm run db:reset` | Drop everything, migrate, seed. **Development only** |
| `npm test` | End-to-end tests against a real MySQL |

`npm run db:reset` deletes all data. It exists because it is the fastest way
to get back to a clean state while building — never point it at production.

---

## How it is laid out

```
backend/
  knexfile.js              database connection for the CLI and the app
  migrations/              the schema, one file per table, in order
  seeds/                   the plans
  src/
    config/                every environment variable, read and checked once
    db/                    the one knex instance
    middleware/            auth, validation, errors, rate limits
    utils/                 money, GST, logging, errors
    modules/               one folder per area of the API
      auth/                OTP, tokens, sessions
      businesses/          the tenant
      parties/             customers and suppliers
      items/               products, stock, batches
      invoices/            invoices, numbering, tax
      payments/            money in and out
      plans/               what you sell
      health/              is it alive
    app.js                 the Express app
    server.js              starting and stopping
  tests/
    api.test.js            79 checks end to end
    concurrency.test.js    16 checks on locking and rollback
```

---

## Decisions worth knowing before you change anything

### Money is stored in paise, as integers

Every amount is a whole number of paise in a `BIGINT`. `4250.75` is stored as
`425075`.

`0.1 + 0.2` is `0.30000000000000004` in JavaScript. On one invoice that is
invisible. Across a year of a shop's books it becomes a mismatch the customer
finds and you cannot explain. Integers do not drift.

Conversion happens at the edges only — `toPaise` when a request arrives,
`toRupees` when a response goes out. Nothing in between touches rupees.

### Invoice numbers come from a locked counter

GST requires an unbroken sequence per series per financial year, and a gap is
what gets asked about at assessment.

`MAX(number) + 1` looks fine until two counters bill in the same second and
both read the same maximum. Instead `invoice_counters` holds one row per
business, document type and year, and it is locked `FOR UPDATE` inside the
invoice transaction. `tests/concurrency.test.js` fires twenty bills at once
and checks every number is unique with no gaps.

### Creating an invoice is one transaction

One bill touches five things: the number, the lines, the stock, the party's
balance, and the stock history. All five commit together or none do.

A bill that took the stock out but did not record the sale is worse than one
that failed — nobody notices until the books disagree weeks later.

### Invoices are cancelled, never deleted

Deleting one leaves a hole in the sequence, which is the thing the rules do
not allow. Cancelling keeps the number, puts the stock back and reverses the
party's balance.

An invoice with money against it cannot be cancelled at all — raise a credit
note instead, which is what the rules expect anyway.

### Stock moves only through one function

`src/modules/items/stock.js` → `move()`. Nothing else writes
`items.current_stock`.

A stock change is two writes that must both happen: the running total, and
the row explaining it. Scattered around the codebase, somebody eventually
does one without the other, and then the stock report and the stock history
disagree with no way to tell which is right.

`stock_moves` is append-only and carries the running balance after each
change, so "what was the stock on 3 March" is one query rather than a sum
from the beginning of time.

### One business can never read another's data

`requireBusiness()` loads the caller's membership and sets `req.business`.
Every query filters on `req.business.id`.

A business id the caller is not a member of returns **404, not 403** —
telling somebody "that exists but you cannot see it" tells them it exists.

### OTPs and refresh tokens are stored hashed

Neither is ever stored in a readable form, for the same reason passwords are
not. Anyone who reads the database — a leaked backup, a curious employee —
still cannot sign in as a customer.

Refresh tokens also rotate: each refresh issues a new one and kills the old.
If a token is presented twice, it leaked, so every session for that user is
ended. That is the standard response to suspected token theft, and
`tests/api.test.js` checks it.

---

## Before this goes live

### Must do

- **`JWT_SECRET`** — a real random 32+ character value. The config refuses to
  start in production without one.
- **An SMS provider, and the TRAI DLT registration.** Sending an OTP in India
  needs a registered sender ID and a registered message template. The
  paperwork takes days to weeks and nothing can be tested without it. Start
  it before you need it. The hook is `sendSms()` in
  `src/modules/auth/service.js`.
- **`OTP_ECHO`** is forced off in production by the config. Do not add a way
  around it — an API that hands out its own OTP is not a login.
- **Database backups.** This is a shop's entire accounts. Automated, tested
  by restoring one, and off the same machine.
- **TLS.** Tokens and invoice data in plain HTTP is not acceptable.

### Should do soon

- **Rate limits in Redis.** They are in memory now, so each instance counts
  on its own. Behind more than one instance that multiplies the real limit.
- **Invoice PDFs.** Not here yet. The data is all there; it needs a renderer.
- **E-invoice and e-way bill.** The columns exist on `invoices` (`irn`,
  `signed_qr`, `ewb_number`); the portal integration does not.
- **GSTR-1 and GSTR-3B exports.** Everything needed is stored.
- **Expenses endpoints.** The table is there, the routes are not.

### Worth knowing

The `isValidGstinFormat` check verifies the **shape and the check digit**. It
does not say the number is real or active — only the GST portal can. Treat a
pass as "this is not a typo", not "this is a genuine GSTIN".

Tax rates and HSN codes are stored as given. Whether they are the right ones
for what is being sold is a question for the shopkeeper's CA, not for this
software.

---

## Tests

```bash
npm run db:reset && npm test
node tests/concurrency.test.js
```

They run against a real MySQL on purpose. A mock cannot tell you that a
`FOR UPDATE` lock holds, that a transaction rolled back cleanly, or that a
unique index actually refused a duplicate — which is the half of this system
most worth testing.

**Both test files wipe and rewrite data.** Point them at a throwaway database.

---

## API, briefly

All responses are `{ ok: true, data: ... }` or
`{ ok: false, error: { code, message, details? } }`.

Business-scoped routes need an `X-Business-Id` header.

| Method | Path | Notes |
|---|---|---|
| GET | `/health`, `/health/db` | |
| GET | `/api/plans` | public |
| POST | `/api/auth/otp/request` | `{ phone }` |
| POST | `/api/auth/otp/verify` | `{ phone, code }` → tokens |
| POST | `/api/auth/refresh` | rotates |
| POST | `/api/auth/logout` | one device or all |
| GET | `/api/auth/me` | user + their businesses |
| GET/PATCH | `/api/auth/me` | |
| GET | `/api/auth/sessions` | active sessions |
| GET/POST | `/api/businesses` | |
| GET/PATCH | `/api/businesses/:id` | |
| GET | `/api/businesses/:id/members` | |
| GET/POST | `/api/parties` | `?search= &type= &owing=` |
| GET/PATCH/DELETE | `/api/parties/:id` | delete is soft |
| GET/POST | `/api/items` | `?search= &lowStock=` |
| GET/PATCH/DELETE | `/api/items/:id` | |
| POST | `/api/items/:id/adjust-stock` | with a reason |
| GET | `/api/items/:id/stock-history` | |
| GET/POST | `/api/invoices` | `?docType= &unpaidOnly= &from= &to=` |
| GET | `/api/invoices/:id` | with lines |
| POST | `/api/invoices/:id/cancel` | |
| GET | `/api/invoices/reports/summary` | |
| GET/POST | `/api/payments` | |
| GET | `/api/payments/reports/day-close` | by payment mode |
