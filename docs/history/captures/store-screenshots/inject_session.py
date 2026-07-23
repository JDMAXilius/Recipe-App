#!/usr/bin/env python3
"""Seed the app's AsyncStorage so the simulator launches in a known state.

RN AsyncStorage on iOS = manifest.json of small inline values, plus overflow files for
large ones (named by md5 of the key). The Supabase session JWT is far over the inline
limit, so it goes to a file and the manifest records null for that key.

usage: inject_session.py <app-data-container> [onboard-only|full]
  onboard-only  skip the carousel, stay signed out   (for the signup capture)
  full          the above plus a signed-in session   (for everything else)
"""
import hashlib
import json
import os
import sys

container = sys.argv[1].rstrip()
mode = sys.argv[2] if len(sys.argv) > 2 else "full"

base = None
for root, dirs, _ in os.walk(os.path.join(container, "Library")):
    if "RCTAsyncLocalStorage_V1" in dirs:
        base = os.path.join(root, "RCTAsyncLocalStorage_V1")
        break
if base is None:
    base = os.path.join(container, "Library", "Application Support", "RCTAsyncLocalStorage_V1")
os.makedirs(base, exist_ok=True)

manifest_path = os.path.join(base, "manifest.json")
try:
    manifest = json.load(open(manifest_path))
except Exception:
    manifest = {}

manifest["otto.onboarded.v1"] = "1"   # skip the 3-screen carousel

if mode == "full":
    KEY = "sb-mepzfdefanfpnrvydyty-auth-token"
    session = json.load(open(os.path.join(os.path.dirname(__file__), "session.json")))
    value = json.dumps(session, separators=(",", ":"))
    fname = hashlib.md5(KEY.encode()).hexdigest()
    with open(os.path.join(base, fname), "w") as fh:
        fh.write(value)
    manifest[KEY] = None              # null = read from the overflow file
    print(f"  session written ({len(value)} bytes) → {fname}")
else:
    print("  onboarding flag only — staying signed out")

with open(manifest_path, "w") as fh:
    json.dump(manifest, fh)
print(f"  storage: {base}")
