import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function AuthRoutesLayout() {
  const { isSignedIn, user } = useAuth();

  // Anonymous sessions ARE signed in — but they come here precisely to claim
  // a real account (first-save ask). Only bounce fully-registered users.
  if (isSignedIn && !user?.is_anonymous) return <Redirect href={"/"} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
