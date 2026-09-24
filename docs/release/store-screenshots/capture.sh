#!/bin/bash
# Recapture the 6.9" App Store screenshots from a RELEASE build on the simulator.
# See README.md in this folder for the two prerequisites (Release build with
# .env.production present, and a fresh session.json for inject_session.py).
set -u
UDID=${UDID:-$(xcrun simctl list devices available | grep "iPhone 17 Pro Max" | grep -oE '[0-9A-F-]{36}' | head -1)}
BUNDLE=com.otto.recipes
HERE=$(cd "$(dirname "$0")" && pwd)
INJECT=$HERE/../../history/captures/store-screenshots/inject_session.py
OUT=${OUT:-$HERE}

shot() { sleep "${2:-6}"; xcrun simctl io "$UDID" screenshot "$OUT/$1.png" >/dev/null 2>&1 && echo "  ✓ $1"; }
go()   { xcrun simctl openurl "$UDID" "$1" >/dev/null 2>&1; sleep 1; }
boot() { xcrun simctl launch "$UDID" "$BUNDLE" >/dev/null 2>&1; }
kill_app() { xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1; sleep 2; }

CONTAINER=$(xcrun simctl get_app_container "$UDID" "$BUNDLE" data 2>/dev/null)
[ -z "$CONTAINER" ] && { echo "app not installed on $UDID — run the Release build first"; exit 1; }

echo "== seed: signed in, onboarding skipped =="
kill_app
python3 "$INJECT" "$CONTAINER" full || exit 1
boot; sleep 15

echo "== captures =="
go "otto:///add";                                    shot 1-bring-in-a-recipe
go "otto:///recipe/cook/52772?step=1&servings=4";    shot 2-cook-one-step-at-a-time 8
go "otto:///plan";                                   shot 3-plan-the-week
# Shopping needs "Build my shopping list" tapped on /plan first (Maestro or by hand),
# then:
go "otto:///shopping";                               shot 4-shopping-list-builds-itself
go "otto:///";                                       shot 5-every-recipe-you-love
# Chat: tap the "Ask Otto" tile on Discover (Maestro point tap ~50%,37%), then:
#                                                    shot 6-ask-otto
go "otto:///otto-club";                              shot 7-otto-club-paywall 7

echo
for f in "$OUT"/*.png; do
  printf "  %-36s %s\n" "$(basename "$f")" "$(sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null | awk '/pixel/{printf "%s ", $2}')"
done
