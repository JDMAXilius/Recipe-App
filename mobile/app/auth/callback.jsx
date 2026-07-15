import { Redirect } from "expo-router";

// OAuth deep-link landing (P10 §3). The session itself is set by
// openAuthSessionAsync's result in lib/socialAuth.js — but expo-router also
// receives the deep link and would flash "Unmatched Route" without this
// (QA P3-12). Route guards take it from here.
export default function AuthCallback() {
  return <Redirect href="/(tabs)" />;
}
