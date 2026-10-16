// ===========================================================================
// Setting up the first shop
// ---------------------------------------------------------------------------
// Shown after a brand new sign-in, because nothing else works without a
// business: an item, a customer and an invoice all belong to one.
//
// Kept to four fields on purpose. The rest - address, GSTIN, logo - can be
// filled in later from settings. A shopkeeper who has just signed up should
// be billing within a minute, not filling a form.
//
// The state is NOT optional, and it is not guessable. It decides CGST+SGST
// versus IGST on every invoice this shop ever raises.
// ===========================================================================

"use client";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { api, ApiError } from "@/lib/api";
import { STATES, INDUSTRIES } from "@/lib/states";

export default function SetupBusiness({ onDone }) {
  const { addBusiness } = useAuth();
  const [v, setV] = useState({ name: "", stateCode: "", industry: "", city: "" });
  const [err, setErr] = useState({});
  const [failed, setFailed] = useState("");
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setV((old) => ({ ...old, [key]: value }));
    if (err[key]) setErr((old) => ({ ...old, [key]: "" }));
    if (failed) setFailed("");
  }

  async function submit(e) {
    e.preventDefault();

    const bad = {};
    if (!v.name.trim()) bad.name = "What is the shop called?";
    if (!v.stateCode) bad.stateCode = "Pick your state";

    setErr(bad);
    if (Object.keys(bad).length) return;

    setBusy(true);
    setFailed("");

    try {
      const business = await api.post("/api/businesses", {
        name: v.name.trim(),
        stateCode: v.stateCode,
        ...(v.industry ? { industry: v.industry } : {}),
        ...(v.city.trim() ? { city: v.city.trim() } : {}),
      });

      addBusiness(business);
      onDone?.(business);
    } catch (ex) {
      if (ex instanceof ApiError && ex.fields) setErr(ex.fields);
      else setFailed(ex instanceof ApiError ? ex.message : "Could not create the shop.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section">
      <div className="wrap ac-setup">
        <h1>Set up your shop</h1>
        <p className="lead">
          One minute. You can add your address, GSTIN and logo later.
        </p>

        <form className="ac-card ac-setup__form" onSubmit={submit} noValidate>
          <label className={`ac-field ${err.name ? "is-bad" : ""}`} htmlFor="sb-name">
            <span>
              Shop name<i aria-hidden="true">*</i>
            </span>
            <input
              id="sb-name"
              value={v.name}
              placeholder="Sharma Kirana Store"
              autoComplete="organization"
              onChange={(e) => set("name", e.target.value)}
            />
            {err.name && <strong className="ac-err">{err.name}</strong>}
          </label>

          <label className={`ac-field ${err.stateCode ? "is-bad" : ""}`} htmlFor="sb-state">
            <span>
              State<i aria-hidden="true">*</i>
            </span>
            <select
              id="sb-state"
              value={v.stateCode}
              onChange={(e) => set("stateCode", e.target.value)}
            >
              <option value="">Pick your state</option>
              {STATES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            {err.stateCode && <strong className="ac-err">{err.stateCode}</strong>}
            <em className="ac-hint">
              This decides whether a bill carries CGST and SGST or IGST, so it
              has to be the state you actually trade from.
            </em>
          </label>

          <div className="ac-two">
            <label className="ac-field" htmlFor="sb-industry">
              <span>
                What do you sell? <b>(optional)</b>
              </span>
              <select
                id="sb-industry"
                value={v.industry}
                onChange={(e) => set("industry", e.target.value)}
              >
                <option value="">Choose one</option>
                {INDUSTRIES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="ac-field" htmlFor="sb-city">
              <span>
                City <b>(optional)</b>
              </span>
              <input
                id="sb-city"
                value={v.city}
                placeholder="Noida"
                autoComplete="address-level2"
                onChange={(e) => set("city", e.target.value)}
              />
            </label>
          </div>

          {failed && (
            <p className="fm-failed" role="alert">
              {failed}
            </p>
          )}

          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "Setting up..." : "Create my shop"}
          </button>
        </form>
      </div>
    </section>
  );
}
