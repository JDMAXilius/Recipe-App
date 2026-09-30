// Tiny App Store Connect API client (ES256 JWT via node:crypto). Usage: node asc.mjs METHOD /path [jsonBody]
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";
// Key is gitignored (credentials/); same key eas.json uses for submit.
const KEY = readFileSync(new URL("../credentials/ios/AuthKey_NTMZWLG54S.p8", import.meta.url), "utf8");
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const head = b64({ alg: "ES256", kid: "NTMZWLG54S", typ: "JWT" });
const body = b64({ iss: "361fd3cd-bc61-405c-ab39-775dae4144b9", iat: now, exp: now + 900, aud: "appstoreconnect-v1" });
const sig = createSign("SHA256").update(`${head}.${body}`).sign({ key: KEY, dsaEncoding: "ieee-p1363" }).toString("base64url");
const [method, path, data] = process.argv.slice(2);
const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
  method, headers: { authorization: `Bearer ${head}.${body}.${sig}`, "content-type": "application/json" }, body: data,
});
console.log(res.status);
console.log(await res.text());
