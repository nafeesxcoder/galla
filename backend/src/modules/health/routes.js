// ===========================================================================
// HEALTH
// ---------------------------------------------------------------------------
// /health      is the process alive? Used by the load balancer.
// /health/db   can it actually reach the database? Used by you, at 2am.
//
// They are separate on purpose. A process that is alive but cannot reach
// MySQL should stay in the load balancer long enough for you to see it,
// not be silently killed and restarted in a loop.
// ===========================================================================

const express = require("express");
const db = require("../../db");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "galla-api",
    uptimeSeconds: Math.round(process.uptime()),
    time: new Date().toISOString(),
  });
});

router.get(
  "/db",
  asyncHandler(async (req, res) => {
    const started = Date.now();
    await db.raw("SELECT 1");
    res.json({ ok: true, database: "reachable", latencyMs: Date.now() - started });
  })
);

module.exports = router;
