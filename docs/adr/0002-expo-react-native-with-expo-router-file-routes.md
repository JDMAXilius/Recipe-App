# ADR-0002: Expo + React Native with expo-router file routes

- **Status:** Accepted
- **Date:** 2026-07-15 (backfilled)
- **Deciders:** Founder · v2 rebuild

## Context
Otto needed one codebase for iOS first (Android and web later), a small team, OTA-friendly JS, and access to native APIs (Sign in with Apple, StoreKit via RevenueCat, notifications, camera).

## Decision
Build the app with Expo (SDK 54 today) and React Native 0.81 (new architecture on), routes as files under `app/` with expo-router, features as modules under `src/features/*` with a shared layer in `src/shared/`.

## Consequences
Good: one language across app and tooling, EAS builds and TestFlight from CI-free terminal sessions, web build for browser journeys. Bad: native-only work (Live Activities, widgets) needs config plugins or native modules; some Apple UI (Liquid Glass tab bar) arrives through `unstable-native-tabs` first.

## Options considered
- Native SwiftUI (rejected: team size, no Android/web path)
- Flutter (rejected: further from the web build and the existing TS code)

## Evidence
- `app.json` (`newArchEnabled: true`)
- `package.json` (`expo ~54`, `expo-router ~6`, `react-native 0.81.5`)
- `docs/reference/ARCHITECTURE.md`
