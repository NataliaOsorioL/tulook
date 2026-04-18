import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import InventoryScreen from './screens/InventoryScreen';

// components temporales para que no dé error el código
const PlaceholderScreen = ({ name }) => (
  <HomeScreen /> // por ahora las pantallas que aún no están desarrolladas mostrarán la página de inicio para verificar que si funcionen
);

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#333',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#F9F7F2',
            height: 85,
            paddingBottom: 20,
            borderTopWidth: 0.5,
            borderTopColor: '#EEE',
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
          component={PlaceholderScreen} 
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="shirt-outline" size={24} color={color} />
          }}
        />
        <Tab.Screen 
          name="Estadísticas" 
          component={PlaceholderScreen} 
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={24} color={color} />
          }}
        />
        <Tab.Screen 
          name="Configuración" 
          component={PlaceholderScreen} 
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}