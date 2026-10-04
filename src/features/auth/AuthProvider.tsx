// The one allowed provider (FRAMEWORK): a thin AuthProvider exposing useAuth().
// Session state is what onAuthStateChange REQUIRES a subscription for — it is
// not query-cache state, so it lives here, not in TanStack Query. Everything
// else (the sign-in/up/out/social actions) is imperative and delegates to
// auth.queries.ts. useAuth() is the cross-feature hook every other feature
// consumes (feature-module.md allowlist).
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Purchases from 'react-native-purchases';
import { hasClubEntitlement } from '@/features/profile/club.logic';
import { z } from 'zod';
import { kv } from '@/shared/storage';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/supabase/client';
import type { AuthMode, SocialProvider } from './social';
import {
  changePassword as changePasswordQuery,
  saveUsername as saveUsernameQuery,
  sendPasswordReset as sendPasswordResetQuery,
  signInWithPassword,
  signInWithProvider as signInWithProviderQuery,
  signOut as signOutQuery,
  signUpWithPassword,
  updatePassword as updatePasswordQuery,
} from './auth.queries';

export interface AuthValue {
  session: Session | null;
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** true = check your inbox (email confirmation required) */
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  saveUsername: (value: string) => Promise<string>;
  signInWithProvider: (provider: SocialProvider, mode: AuthMode) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setIsLoaded(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;

  // Keep RevenueCat's app user id in step with the Supabase user, so the
  // membership webhook can map subscription events to accounts.
  const uid = user?.id;
  // logOut only on a real sign-out (a uid → none transition). The SDK's logOut
  // "generates a random user id and saves it" (purchases.d.ts), so calling it
  // on every launch — before the session has even loaded — minted a fresh
  // anonymous customer each start and logged an error when already anonymous
  // (audit 2026-10-04, UX ticket F2).
  const lastUid = useRef<string | undefined>(undefined);
  // After logIn, sync ONCE per account on this phone (not every sign-in): it
  // recovers a purchase Apple completed but RevenueCat missed (seen 2026-10-02),
  // while RevenueCat warns repeated syncs move a subscription between accounts
  // that share an Apple ID (Transfer behavior). Restore purchases is the manual path.
  useEffect(() => {
    const previous = lastUid.current;
    lastUid.current = uid;
    if (!uid) {
      if (previous) Purchases.logOut().catch(() => {});
      return;
    }
    Purchases.logIn(uid)
      .then(async ({ customerInfo }) => {
        if (hasClubEntitlement(customerInfo)) return;
        const synced = await kv.get('rcSynced', [] as string[], z.array(z.string()));
        if (synced.includes(uid)) return;
        await kv.set('rcSynced', [...synced, uid]);
        await Purchases.syncPurchasesForResult();
      })
      .catch(() => {});
  }, [uid]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      user,
      isLoaded,
      isSignedIn: !!session,
      signIn: signInWithPassword,
      signUp: signUpWithPassword,
      signOut: signOutQuery,
      sendPasswordReset: sendPasswordResetQuery,
      updatePassword: updatePasswordQuery,
      // Bind the signed-in user's email so callers pass only the two passwords.
      changePassword: (currentPassword, newPassword) =>
        changePasswordQuery(user?.email ?? '', currentPassword, newPassword),
      saveUsername: saveUsernameQuery,
      signInWithProvider: signInWithProviderQuery,
    }),
    [session, user, isLoaded],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
