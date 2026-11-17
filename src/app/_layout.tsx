import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BooksProvider } from '@/features/books/books-provider';
import { palette as c } from '@/constants/design';
export default function RootLayout() {
  return <BooksProvider><StatusBar style="dark" /><Stack screenOptions={{ headerStyle: { backgroundColor: c.background }, headerTintColor: c.ink, contentStyle: { backgroundColor: c.background } }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="books/new" options={{ title: 'Add book' }} />
    <Stack.Screen name="books/[id]" options={{ title: 'Book details' }} />
    <Stack.Screen name="books/edit" options={{ title: 'Edit book' }} />
  </Stack></BooksProvider>;
}
