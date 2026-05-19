import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { seedForUser, validateFirestoreData } from './src/database/seed';
import { createUserProfile, getUserProfile } from './src/services/user.service';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const Tab = createBottomTabNavigator();

async function initializeAppForUser(userId, email) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) {
      await createUserProfile(userId, {
        name: email?.split('@')[0] || 'Usuario',
        email: email || '',
      });
      console.log('[App] Perfil de usuario creado');
    }

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
  const { isAuthenticated, isLoading, user } = useAuth();
  const initRun = useRef(false);
  const isDark = colors.background === '#121212';

  useEffect(() => {
    if (isAuthenticated && user && !initRun.current) {
      initRun.current = true;
      initializeAppForUser(user.uid, user.email);
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F2EA' }}>
        <ActivityIndicator size="large" color="#529bd6" />
      </View>
    );
  }

  if (!isAuthenticated) {
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
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
