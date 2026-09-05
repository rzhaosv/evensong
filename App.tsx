import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { colors } from './src/theme';
import { AppProvider, useApp } from './src/store/AppContext';
import { RootStackParamList, TabParamList } from './src/navigation';
import { setupNotificationHandler } from './src/services/notifications';
import TabIcon from './src/components/TabIcon';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TodayScreen from './src/screens/TodayScreen';
import JournalScreen from './src/screens/JournalScreen';
import YearScreen from './src/screens/YearScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ReadingScreen from './src/screens/ReadingScreen';
import ExamenScreen from './src/screens/ExamenScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import { demo } from './src/dev/demo';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.ink,
    primary: colors.accent,
    border: colors.line,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName={demo?.tab ?? 'Today'}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.bg },
        tabBarIcon: ({ color, size }) => (
          <TabIcon name={route.name.toLowerCase() as 'today' | 'journal' | 'year' | 'settings'} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Year" component={YearScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { ready, state } = useApp();
  const [justOnboarded, setJustOnboarded] = useState(false);

  useEffect(() => {
    setupNotificationHandler();
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!state.onboarded) return <OnboardingScreen onDone={() => setJustOnboarded(true)} initialStep={demo?.onboardStep} still={!!demo?.snap} />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={demo?.screen ?? (justOnboarded ? 'Paywall' : 'Tabs')}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
      >
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Reading" component={ReadingScreen} />
        <Stack.Screen name="Examen" component={ExamenScreen} options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ presentation: 'modal', gestureEnabled: !justOnboarded }}
          initialParams={justOnboarded ? { fromOnboarding: true } : undefined}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Web-only: pin the app to the viewport (phone-sized window when capturing screenshots)
// and pad for the iOS status bar / home indicator so captures match a real device.
const frameBg = demo && (demo.period === 'evening' || demo.screen === 'Paywall' || demo.screen === 'Examen') ? colors.navy : colors.bg;
const webFrame =
  Platform.OS === 'web'
    ? ({ width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: frameBg } as const)
    : null;
const demoInsets = demo ? { paddingTop: 59, paddingBottom: 34 } : null;

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppProvider>
        <View style={[{ flex: 1 }, webFrame as any, demoInsets]}>
          <Root />
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}
