import { ActivityIndicator } from 'react-native';
import { Button, Card, Copy, Screen, ui } from '@/components/reading-ui';
import { useBooks } from './books-provider';
export function LibraryState() {
  const { loading, error, reload } = useBooks();
  return <Screen><Card>{loading ? <><ActivityIndicator accessibilityLabel="Loading library" /><Copy>Opening your library…</Copy></> : <><Copy style={ui.heading}>Library unavailable</Copy><Copy>{error}</Copy><Button label="Try again" onPress={() => void reload()} /></>}</Card></Screen>;
}
