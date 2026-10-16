// ===========================================================================
// LICENCE KEYS
// ---------------------------------------------------------------------------
// A key exists before anybody owns it. That is what makes it sellable through
// a shop, a partner or a reseller who has no access to this system: you issue
// a batch, they sell them on, and each key attaches to a business the day
// somebody types it in.
//
// THE ALPHABET
// ------------
// XXXXX-XXXXX-XXXXX-XXXXX, and it will be read aloud down a phone line by a
// shopkeeper to a partner's support desk far more often than it is copied and
// pasted. So it uses Crockford's base32: the digits plus the letters, with
// I, L, O and U left out.
//
// Leaving a letter out is only half the job. The other half is ACCEPTING it
// on the way in: somebody who sees 0 will type O, and somebody who sees 1
// will type I or l. Those are corrected rather than rejected, because a valid
// key refused over a letter that was never in it is a support call and a
// customer who believes they have been cheated.
//
// U is dropped for a different reason: it is the one that turns a random
// string into a word somebody has to read out in a shop.
// ===========================================================================

const crypto = require("node:crypto");

// Crockford base32. No I, L, O or U.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const GROUPS = 4;
const PER_GROUP = 5;
const LENGTH = GROUPS * PER_GROUP;

/** A new key. Random, never sequential - a guessable key is a free licence. */
function generateCode() {
  let out = "";
  for (let i = 0; i < LENGTH; i++) {
    if (i > 0 && i % PER_GROUP === 0) out += "-";
    // randomInt per character keeps the distribution even. Taking one large
    // random number and using modulo does not, and the bias is exactly the
    // sort of thing nobody notices until somebody is guessing keys.
    out += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return out;
}

/**
 * Turns what somebody typed into what is stored, or null if it cannot be one.
 *
 * Handles lower case, missing or extra dashes, spaces, and the four letters
 * that are not in the alphabet but that people type anyway.
 */
function normalise(input) {
  const body = String(input ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    // The misreads, in the direction the alphabet actually goes.
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    // U is in no key, and the only thing it is ever mistaken for is V.
    .replace(/U/g, "V");

  if (body.length !== LENGTH) return null;
  // Anything still outside the alphabet is not a key, however it was typed.
  if ([...body].some((c) => !ALPHABET.includes(c))) return null;

  const parts = [];
  for (let i = 0; i < GROUPS; i++) parts.push(body.slice(i * PER_GROUP, (i + 1) * PER_GROUP));
  return parts.join("-");
}

module.exports = { generateCode, normalise, ALPHABET, LENGTH };
