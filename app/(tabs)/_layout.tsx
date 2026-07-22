import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/tokens';
import { TabBarCreateButton } from './TabBarCreateButton';

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.terracotta,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Discover', tabBarIcon: tabIcon('restaurant') }}
      />
      <Tabs.Screen
        name="cookbook"
        options={{ title: 'Cookbook', tabBarIcon: tabIcon('paw') }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarLabel: () => null,
          tabBarButton: (props) => <TabBarCreateButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{ title: 'Plan', tabBarIcon: tabIcon('calendar') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Account', tabBarIcon: tabIcon('person') }}
      />
    </Tabs>
  );
}
