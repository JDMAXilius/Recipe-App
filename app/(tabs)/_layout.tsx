import { useEffect, useState } from 'react';
import { Tabs, usePathname, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/tokens';
import { TabBarCreateButton } from '@/shared/ui/TabBarCreateButton';
import { TabBarOttoButton } from '@/shared/ui/TabBarOttoButton';
import { flags } from '@/shared/flags';
import { kv } from '@/shared/storage';
import { restoreTarget, tabForPath } from '@/shared/lastTab';

// R3.5: the last tab comes back once per cold launch (module scope, not state:
// a remount of the tabs must not jump the person again).
let restoreDone = false;

function useRestoreLastTab(enabled: boolean) {
  const pathname = usePathname();
  const router = useRouter();
  // Saving waits for the read, so the first Home render can't overwrite the
  // tab it is about to restore.
  const [ready, setReady] = useState(restoreDone);
  useEffect(() => {
    if (!enabled || restoreDone) return;
    restoreDone = true;
    const at = pathname;
    void kv.get<unknown>('lastTab', null).then((saved) => {
      const to = restoreTarget(at, saved);
      if (to) router.navigate(to as Href);
      setReady(true);
    });
    // Once, on the first mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!enabled || !ready) return;
    const tab = tabForPath(pathname);
    if (tab) void kv.set('lastTab', tab);
  }, [enabled, ready, pathname]);
}

// 5 tabs (FRAMEWORK §2 / spec §Bottom tab bar): Discover · Cookbook · raised ＋ ·
// Plan · Account. Ionicons filled when focused, outline otherwise; the center
// `create` tab renders as a raised terracotta ＋ (TabBarCreateButton). Icons
// render on web and native. Active tint = terracotta, inactive = inkSoft.
type IoniconName = keyof typeof Ionicons.glyphMap;

function tabIcon(base: string) {
  const Icon = ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons
      name={(focused ? base : `${base}-outline`) as IoniconName}
      size={size}
      color={color}
    />
  );
  Icon.displayName = `TabIcon(${base})`;
  return Icon;
}

export default function TabsLayout() {
  const v2 = flags.flowV2;
  useRestoreLastTab(v2);
  // Sign-in + Otto Club are enforced once, for every route, by the root
  // Stack.Protected guard (app/_layout.tsx RootStack).
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.terracotta,
        tabBarInactiveTintColor: colors.inkSoft,
        // No maxFontSizeMultiplier here: on iOS 13+ react-navigation already
        // pins tab labels to their base size and serves the Large Content
        // Viewer on long-press — exactly Apple's own tab bar behaviour.
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
      }}
    >
      {/* flowV2 (ADR-0008): Home · Plan · Cookbook · Account + the Otto circle.
          Off: Discover · Cookbook · ＋ · Plan · Account. A tab that isn't in
          this build's set is hidden with href: null, never removed, so its
          route still resolves. */}
      <Tabs.Screen name="index" options={{ title: v2 ? 'Home' : 'Discover', tabBarIcon: tabIcon(v2 ? 'home' : 'restaurant') }} />
      {/* Plan sits second in flowV2, fourth otherwise: an array keeps
          expo-router's children Screens-only (a `false` child warns). */}
      {v2 ? [<Tabs.Screen key="plan" name="plan" options={{ title: 'Plan', tabBarIcon: tabIcon('calendar') }} />] : []}
      <Tabs.Screen name="cookbook" options={{ title: 'Cookbook', tabBarIcon: tabIcon('paw') }} />
      <Tabs.Screen
        name="create"
        listeners={({ navigation }) => ({
          // The ＋ button must always open a FRESH chat. Reopening a recent
          // thread pushes /create?chat=<id>; without this the sticky param
          // makes a later ＋ tap reload that old thread instead of a blank chat.
          tabPress: () => navigation.setParams({ chat: undefined }),
        })}
        options={
          v2
            ? { href: null }
            : { title: 'Create', tabBarLabel: () => null, tabBarButton: (props) => <TabBarCreateButton {...props} /> }
        }
      />
      {v2 ? [] : [<Tabs.Screen key="plan" name="plan" options={{ title: 'Plan', tabBarIcon: tabIcon('calendar') }} />]}
      <Tabs.Screen name="profile" options={{ title: 'Account', tabBarIcon: tabIcon('person') }} />
      <Tabs.Screen
        name="otto"
        listeners={({ navigation }) => ({ tabPress: () => navigation.setParams({ chat: undefined }) })}
        options={
          v2
            ? { title: 'Otto', tabBarLabel: () => null, tabBarButton: (props) => <TabBarOttoButton {...props} /> }
            : { href: null }
        }
      />
    </Tabs>
  );
}
