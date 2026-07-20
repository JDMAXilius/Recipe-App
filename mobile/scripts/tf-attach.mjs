#!/usr/bin/env node
// Attach the newest processed build to the TestFlight group that has the testers.
//
// `eas submit` uploads a build but does NOT hand it to anyone — testers see
// nothing until it's attached to their group. Apple won't let the API flip
// "distribute all builds" on an existing group (hasAccessToAllBuilds is
// create-only, PATCH returns 409), so this runs after each submit instead.
//
//   node scripts/tf-attach.mjs            # attaches latest build to DEFAULT_GROUP
//   node scripts/tf-attach.mjs "Other"    # or a named group
//
// Credentials come from eas.json's submit.production.ios block — the same ASC
// API key eas submit already uses, so there is nothing extra to configure.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_GROUP = "Otto Insiders";
const groupName = process.argv[2] || DEFAULT_GROUP;

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ios = JSON.parse(fs.readFileSync(path.join(root, "eas.json"), "utf8")).submit?.production?.ios;
if (!ios?.ascApiKeyPath) {
  console.error("eas.json is missing submit.production.ios.ascApiKeyPath");
  process.exit(2);
}
const { ascApiKeyPath: KEY_PATH, ascApiKeyId: KEY_ID, ascApiKeyIssuerId: ISSUER, ascAppId: APP } = ios;
if (!fs.existsSync(KEY_PATH)) {
  console.error(`ASC key not found at ${KEY_PATH} — it lives outside the repo by design.`);
  process.exit(2);
}

const b64u = (b) =>
  Buffer.from(b).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

function token() {
  const now = Math.floor(Date.now() / 1000);
  const input =
    b64u(JSON.stringify({ alg: "ES256", kid: KEY_ID, typ: "JWT" })) +
    "." +
    b64u(JSON.stringify({ iss: ISSUER, iat: now, exp: now + 600, aud: "appstoreconnect-v1" }));
  // ieee-p1363 is what ASC wants; the default DER encoding is rejected as invalid.
  const sig = crypto.sign(null, Buffer.from(input), {
    key: fs.readFileSync(KEY_PATH),
    dsaEncoding: "ieee-p1363",
  });
  return input + "." + b64u(sig);
}

async function api(p, opts = {}) {
  const res = await fetch("https://api.appstoreconnect.apple.com" + p, {
    ...opts,
    headers: { Authorization: "Bearer " + token(), "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : {} };
}

const groups = (await api(`/v1/apps/${APP}/betaGroups?limit=50`)).body.data || [];
const group = groups.find((g) => g.attributes.name === groupName);
if (!group) {
  console.error(`No TestFlight group named "${groupName}". Found: ${groups.map((g) => g.attributes.name).join(", ") || "(none)"}`);
  process.exit(1);
}

const build = (await api(`/v1/builds?filter[app]=${APP}&sort=-uploadedDate&limit=1`)).body.data?.[0];
if (!build) {
  console.error("No builds found for this app.");
  process.exit(1);
}
const { version, processingState } = build.attributes;
if (processingState !== "VALID") {
  // Apple takes ~5-15 min after upload; attaching early just fails.
  console.error(`Build ${version} is ${processingState}, not VALID yet — wait for Apple to finish processing.`);
  process.exit(1);
}

const res = await api(`/v1/betaGroups/${group.id}/relationships/builds`, {
  method: "POST",
  body: JSON.stringify({ data: [{ type: "builds", id: build.id }] }),
});
if (res.status >= 400) {
  const detail = res.body.errors?.[0]?.detail || JSON.stringify(res.body);
  // Already attached is a success as far as the caller cares.
  if (/already/i.test(detail)) console.log(`build ${version} was already on "${groupName}"`);
  else {
    console.error(`attach failed: ${res.status} ${detail}`);
    process.exit(1);
  }
} else {
  console.log(`attached build ${version} to "${groupName}"`);
}

const testers = (await api(`/v1/betaGroups/${group.id}/betaTesters?limit=50`)).body.data || [];
console.log(`${testers.length} tester(s) can install it: ${testers.map((t) => t.attributes.email).join(", ")}`);
