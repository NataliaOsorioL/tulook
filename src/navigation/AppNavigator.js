import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import HomeScreen from '../../screens/HomeScreen';
import InventoryScreen from '../../screens/InventoryScreen';
import OutfitScreen from '../../screens/OutfitScreen';
import StatisticsScreen from '../../screens/StatisticScreen';
import ConfigurationScreen from '../../screens/ConfigurationScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { colors } = useTheme();

  return (
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
  );
}
