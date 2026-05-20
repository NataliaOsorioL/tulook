import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import EditProfileScreen from './screens/EditProfileScreen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const RootStack = createNativeStackNavigator();

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#529bd6"
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        style={
          colors.background === '#121212'
            ? 'light'
            : 'dark'
        }
      />

      <RootStack.Navigator
        screenOptions={{ headerShown: false }}
      >
        {isAuthenticated ? (

          <RootStack.Group navigationKey="authenticated">

            <RootStack.Screen
              name="HomeTabs"
              component={AppNavigator}
            />

            <RootStack.Screen
              name="EditProfile"
              component={EditProfileScreen}
            />

          </RootStack.Group>

        ) : (

          <RootStack.Group navigationKey="guest">

            <RootStack.Screen
              name="Login"
              component={LoginScreen}
            />

            <RootStack.Screen
              name="Register"
              component={RegisterScreen}
            />

            <RootStack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />

          </RootStack.Group>

        )}
      </RootStack.Navigator>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F2EA',
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}