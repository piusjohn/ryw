import { StatusBar } from 'expo-status-bar';
import AppTabs from '@/components/app-tabs';

export default function RootLayout() {
  return <><StatusBar style="dark" /><AppTabs /></>;
}
