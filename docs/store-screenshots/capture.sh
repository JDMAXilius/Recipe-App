#!/bin/bash
# Recapture the 5 App Store 6.7" screens from a RELEASE build on the simulator.
# Release matters: a dev build shows the expo-dev-client launcher and dev menu,
# neither of which can appear in a store screenshot.
#
# Order matters — signup must be captured while still signed out.
set -u
UDID=E8CFF59C-475F-460B-B831-0F12D5469342
BUNDLE=com.otto.recipes
S=/private/tmp/claude-501/-Users-juan/71e2d723-d126-4ef1-98d8-7faf3c3121df/scratchpad
OUT=$S/captures
mkdir -p "$OUT"

shot() { sleep "${2:-5}"; xcrun simctl io "$UDID" screenshot "$OUT/$1.png" >/dev/null 2>&1 && echo "  ✓ $1"; }
go()   { xcrun simctl openurl "$UDID" "$1" >/dev/null 2>&1; sleep 1; }
boot() { xcrun simctl launch "$UDID" "$BUNDLE" >/dev/null 2>&1; }
kill_app() { xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1; sleep 2; }

CONTAINER=$(xcrun simctl get_app_container "$UDID" "$BUNDLE" data 2>/dev/null)
if [ -z "$CONTAINER" ]; then echo "app not installed"; exit 1; fi

echo "== seed: onboarding skipped, signed out =="
kill_app
python3 "$S/inject_session.py" "$CONTAINER" onboard-only || exit 1

echo "== 1/5 signup =="
boot; sleep 12
go "mobile:///sign-up"
shot signup 7

echo "== seed: signed in =="
kill_app
python3 "$S/inject_session.py" "$CONTAINER" full || exit 1

echo "== 2/5 discover =="
boot; sleep 15
shot discover 6

echo "== 3/5 detail =="
go "mobile:///recipe/52772"
shot detail 8

echo "== 4/5 cook =="
go "mobile:///recipe/cook/52982?step=2&servings=3"
shot cook 9

echo "== 5/5 plan =="
go "mobile:///plan"
shot plan 8

echo
for f in signup discover detail cook plan; do
  [ -f "$OUT/$f.png" ] \
    && printf "  %-9s %s\n" "$f" "$(sips -g pixelWidth -g pixelHeight "$OUT/$f.png" 2>/dev/null | awk '/pixel/{printf "%s ", $2}')" \
    || printf "  %-9s MISSING\n" "$f"
done
