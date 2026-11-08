import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider } from './src/AuthContext';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import { font } from './src/theme';
import Icon from './src/components/Icon';
import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import WatchScreen from './src/screens/WatchScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import CollectionDetailScreen from './src/screens/CollectionDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DetailScreen from './src/screens/DetailScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import PremiumScreen from './src/screens/PremiumScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// The five destinations from the brief, always labelled. The active tab gets a Mango pill.
const TABS = [
  ['Home', HomeScreen, 'home'],
  ['Explore', ExploreScreen, 'explore'],
  ['Watch', WatchScreen, 'watch'],
  ['Collection', CollectionScreen, 'collection'],
  ['Profile', ProfileScreen, 'profile'],
];

function Tabs() {
  const { c } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, height: 68, paddingTop: 6 },
        tabBarLabel: ({ focused }) => (
          <Text style={{ fontFamily: font.bold, fontSize: 12, color: focused ? c.text : c.text2 }}>{route.name}</Text>
        ),
        tabBarIcon: ({ focused }) => (
          <View style={{ width: 52, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? c.highlight : 'transparent' }}>
            <Icon name={TABS.find((t) => t[0] === route.name)[2]} size={22} color={focused ? c.ink : c.text2} />
          </View>
        ),
      })}
    >
      {TABS.map(([name, component]) => (
        <Tab.Screen key={name} name={name} component={component} />
      ))}
    </Tab.Navigator>
  );
}

function Root() {
  const { c, dark } = useTheme();
  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, primary: c.primary, background: c.bg, card: c.surface, text: c.text, border: c.border } };
  const header = { headerTitleStyle: { fontFamily: font.bold, fontSize: 17 }, headerTintColor: c.text, headerStyle: { backgroundColor: c.surface }, headerShadowVisible: false, headerBackTitle: 'Kembali' };
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={header}>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ title: '' }} />
        <Stack.Screen name="Player" component={PlayerScreen} options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="Premium" component={PremiumScreen} options={{ title: 'KELIR Premium' }} />
        <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} options={{ title: 'Koleksi' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Masuk', presentation: 'modal' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Daftar', presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8ED' }}>
        <ActivityIndicator color="#C9473D" />
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
