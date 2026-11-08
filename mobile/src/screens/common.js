import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../components/Logo';
import { Avatar, Button, IconButton, T } from '../components/ui';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { space } from '../theme';

/** Top bar on tab screens: logo, search, account. */
export function TopBar({ title }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  return (
    <View style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: space[4], flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.bg, borderBottomWidth: 1, borderColor: c.border }}>
      {title ? <T variant="h2" style={{ flex: 1 }} accessibilityRole="header">{title}</T> : <View style={{ flex: 1 }}><Logo size={26} ink={c.text} window={c.bg} /></View>}
      <IconButton icon="search" label="Cari" onPress={() => navigation.navigate('Tabs', { screen: 'Explore', params: { focusSearch: Date.now() } })} />
      {user ? (
        <Pressable onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })} accessibilityRole="button" accessibilityLabel={`Profile ${user.name}`}>
          <Avatar user={user} size={34} />
        </Pressable>
      ) : (
        <Button title="Masuk" size="sm" onPress={() => navigation.navigate('Login')} />
      )}
    </View>
  );
}
