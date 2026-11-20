import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { palette as c } from '@/constants/design';

const tabs = [
  { name: 'index', title: 'Home', icon: '⌂' },
  { name: 'library', title: 'Library', icon: '▤' },
  { name: 'groups', title: 'Groups', icon: '♧' },
  { name: 'leaderboard', title: 'Leaderboard', icon: '▥' },
  { name: 'profile', title: 'Profile', icon: '◎' },
];
export default function AppTabs() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.orange,
    tabBarInactiveTintColor: c.muted, tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }, tabBarHideOnKeyboard: true }}>
    {tabs.map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title,
      tabBarIcon: ({ color }) => <Text accessible={false} style={{ fontSize: 26, lineHeight: 30, color }}>{tab.icon}</Text>,
    }} />)}
  </Tabs>;
}
