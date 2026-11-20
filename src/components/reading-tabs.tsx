import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { palette as c } from '@/constants/design';

const tabs = [
  { name: 'index', title: 'Home', icon: '⌂' },
  { name: 'library', title: 'Library', icon: '▤' },
  { name: 'groups', title: 'Groups', icon: '♧' },
  { name: 'leaderboard', title: 'Leaderboard', icon: '▥' },
  { name: 'profile', title: 'Profile', icon: '◎' },
];
export default function AppTabs() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.accent,
    tabBarInactiveTintColor: c.muted, tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }, tabBarHideOnKeyboard: true }}>
    {tabs.map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title,
      tabBarIcon: ({ color, focused }) => <View style={{ width: 48, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? c.softGreen : 'transparent' }}><Text accessible={false} style={{ fontSize: 24, lineHeight: 28, color }}>{tab.icon}</Text></View>,
    }} />)}
  </Tabs>;
}
