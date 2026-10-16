// ===========================================================================
// THE STARTUP FILE FOR SHARED HOSTING (cPanel / Passenger)
// ---------------------------------------------------------------------------
// `npm start` runs `next start`, which is a command, not a file. cPanel's
// Node.js App does not run commands - it loads ONE file and expects it to
// start listening. This is that file.
//
// It is only needed on cPanel. Locally, `npm run dev` is unchanged and this
// file is never touched.
//
// WHAT HAS TO BE TRUE BEFORE THIS RUNS
// ------------------------------------
// `npm run build` must have been done, and the .next folder must be sitting
// beside this file. Next does not build on demand in production - if .next
// is missing this exits immediately with a message saying so, rather than
// serving 500s for every request while the real reason sits in a log.
//
// THE PORT IS NOT OURS TO CHOOSE
// ------------------------------
// Passenger assigns one and passes it in process.env.PORT. Hardcoding 3000
// is the single most common reason a Node app on cPanel starts cleanly and
// then answers nothing: it is listening, just not where the web server is
// looking.
// ===========================================================================

const { createServer } = require("node:http");
const { existsSync } = require("node:fs");
const { join } = require("node:path");
const next = require("next");

const dir = __dirname;

if (!existsSync(join(dir, ".next"))) {
  console.error("");
  console.error("  There is no .next folder next to server.js.");
  console.error("");
  console.error("  Next.js does not build itself in production. Run:");
  console.error("");
  console.error("      npm run build");
  console.error("");
  console.error("  and start the app again.");
  console.error("");
  process.exit(1);
}

const port = Number(process.env.PORT) || 3000;
const app = next({ dev: false, dir });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`myGallaBook site listening on ${port}`);
    });
  })
  .catch((err) => {
    // Passenger shows a generic 503 when the startup file throws, so the
    // real error has to be printed or it is lost entirely.
    console.error("the site failed to start:", err);
    process.exit(1);
  });
