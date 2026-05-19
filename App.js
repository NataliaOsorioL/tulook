import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import InventoryScreen from './screens/InventoryScreen';
import OutfitScreen from './screens/OutfitScreen';
import StatisticsScreen from './screens/StatisticScreen';
import ConfigurationScreen from './screens/ConfigurationScreen';
import { ensureSignedIn } from './src/services/auth.service';
import { seedForUser, validateFirestoreData } from './src/database/seed';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const Tab = createBottomTabNavigator();
const isLoggedIn = false;

async function initializeApp() {
  try {
    const userId = await ensureSignedIn();
    console.log('[App] Usuario autenticado:', userId);

    const seed = await seedForUser(userId);
    if (!seed.skipped) {
      console.log('[App] Seed completado exitosamente');
    }

    const validation = await validateFirestoreData(userId);
    for (const v of validation) {
      const icon = v.ok ? '✓' : '✗';
      console.log(`[App] Validación ${icon} ${v.check}: ${v.count || 0}`);
    }
  } catch (err) {
    console.warn('[App] Error en inicialización:', err.message);
  }
}

function AppContent() {
  const { colors } = useTheme();
  const isDark = colors.background === '#121212';

   if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const navTheme = isDark ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.card,
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.card,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBarBg,
            height: 85,
            paddingBottom: 20,
            borderTopWidth: 0.5,
            borderTopColor: colors.tabBarBorder,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
        })}
      >
        <Tab.Screen
          name="Inicio"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />
          }}
        />
        <Tab.Screen
          name="Inventario"
          component={InventoryScreen}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} />
          }}
        />
        <Tab.Screen
          name="Crear Outfit"
          component={OutfitScreen}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="shirt-outline" size={24} color={color} />
          }}
        />
        <Tab.Screen
          name="Estadísticas"
          component={StatisticsScreen}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={24} color={color} />
          }}
        />
        <Tab.Screen
          name="Configuración"
          component={ConfigurationScreen}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const initRun = useRef(false);

  useEffect(() => {
    if (!initRun.current) {
      initRun.current = true;
      initializeApp();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
