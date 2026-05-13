import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Switch, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { getUserProfile, updateUserProfile } from '../src/services/user.service';
import { ensureSignedIn } from '../src/services/auth.service';
import { useTheme } from '../src/context/ThemeContext';

export default function SettingsScreen() {
  const { themeMode, setThemeMode, colors } = useTheme();
  const themedStyles = useMemo(() => getStyles(colors), [colors]);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [temperatureUnit, setTemperatureUnit] = useState('C');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadProfile();
    return () => { mountedRef.current = false; };
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const userId = await ensureSignedIn();
      const data = await getUserProfile(userId);
      if (data && mountedRef.current) {
        setProfile(data);
        setNotifications(data.notifications ?? true);
        setTemperatureUnit(data.temperature_unit || 'C');
        setThemeMode(data.theme || 'light');
      }
    } catch (err) {
      console.warn('[Config] Error:', err.message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  const savePreference = async (updates) => {
    try {
      setIsSaving(true);
      const userId = await ensureSignedIn();
      await updateUserProfile(userId, updates);
    } catch (err) {
      console.warn('[Config] Error al guardar:', err.message);
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  };

  const handleTempChange = (unit) => {
    setTemperatureUnit(unit);
    savePreference({ temperature_unit: unit });
  };

  const handleThemeChange = (newTheme) => {
    setThemeMode(newTheme);
  };

  const handleNotificationsChange = (value) => {
    setNotifications(value);
    savePreference({ notifications: value });
  };

  const handleLogout = async () => {
    console.log('[Config] Cerrar sesión - pendiente implementar con Firebase Auth');
  };

  const handleEditProfile = () => {
    console.log('[Config] Editar perfil - pendiente implementar');
  };

  const handleChangePassword = () => {
    console.log('[Config] Cambiar contraseña - pendiente implementar');
  };

  if (isLoading) {
    return (
      <View style={themedStyles.container}>
        <View style={themedStyles.header}>
          <TouchableOpacity style={themedStyles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={themedStyles.headerTitle}>Configuración</Text>
          <View style={{ width: 35 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#999" />
        </View>
      </View>
    );
  }

  return (
    <View style={themedStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={themedStyles.header}>
          <TouchableOpacity style={themedStyles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={themedStyles.headerTitle}>Configuración</Text>
          <View style={{ width: 35 }} />
        </View>

        <View style={themedStyles.card}>
          <Text style={themedStyles.sectionTitle}>Perfil</Text>

          <View style={themedStyles.profileRow}>
            <View style={themedStyles.profileInfo}>
              <Image
                source={{
                  uri: profile?.avatar_url || 'https://via.placeholder.com/100',
                }}
                style={themedStyles.avatar}
              />

              <View>
                <Text style={themedStyles.name}>{profile?.name || 'Usuario'}</Text>
                <Text style={themedStyles.email}>{profile?.email || ''}</Text>
              </View>
            </View>

            <TouchableOpacity style={themedStyles.editButton} onPress={handleEditProfile}>
              <Text style={themedStyles.editText}>Editar perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={themedStyles.card}>
          <Text style={themedStyles.sectionTitle}>Preferencias</Text>

          <View style={themedStyles.preferenceRow}>
            <View style={themedStyles.preferenceLeft}>
              <Text style={themedStyles.icon}>🌡️</Text>
              <Text style={themedStyles.preferenceText}>Unidad de temperatura</Text>
            </View>

            <View style={themedStyles.tempButtons}>
              <TouchableOpacity
                style={temperatureUnit === 'C' ? themedStyles.activeTemp : themedStyles.tempButton}
                onPress={() => handleTempChange('C')}
              >
                <Text style={temperatureUnit === 'C' ? themedStyles.activeTempText : undefined}>°C</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={temperatureUnit === 'F' ? themedStyles.activeTemp : themedStyles.tempButton}
                onPress={() => handleTempChange('F')}
              >
                <Text style={temperatureUnit === 'F' ? themedStyles.activeTempText : undefined}>°F</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={themedStyles.preferenceRow}>
            <View style={themedStyles.preferenceLeft}>
              <Text style={themedStyles.icon}>🧸</Text>
              <Text style={themedStyles.preferenceText}>Tema</Text>
            </View>

            <View style={themedStyles.themeContainer}>
              <TouchableOpacity
                style={themeMode === 'light' ? themedStyles.activeTheme : themedStyles.themeButton}
                onPress={() => handleThemeChange('light')}
              >
                <Text style={themeMode === 'light' ? themedStyles.activeThemeText : undefined}>Claro</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={themeMode === 'dark' ? themedStyles.activeTheme : themedStyles.themeButton}
                onPress={() => handleThemeChange('dark')}
              >
                <Text style={themeMode === 'dark' ? themedStyles.activeThemeText : undefined}>Oscuro</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={themeMode === 'auto' ? themedStyles.activeTheme : themedStyles.themeButton}
                onPress={() => handleThemeChange('auto')}
              >
                <Text style={themeMode === 'auto' ? themedStyles.activeThemeText : undefined}>Automático</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={themedStyles.card}>
          <Text style={themedStyles.sectionTitle}>Notificaciones</Text>

          <View style={themedStyles.preferenceRow}>
            <View style={themedStyles.preferenceLeft}>
              <Ionicons name="notifications-outline" size={20} color="#777" />
              <Text style={themedStyles.preferenceText}>Notificaciones generales</Text>
            </View>

            <Switch
              value={notifications}
              onValueChange={handleNotificationsChange}
              trackColor={{ false: colors.configSwitchTrackOff, true: colors.configSwitchTrackOn }}
            />
          </View>
        </View>

        <View style={themedStyles.card}>
          <Text style={themedStyles.sectionTitle}>Privacidad</Text>

          <TouchableOpacity style={themedStyles.preferenceRow} onPress={handleChangePassword}>
            <View style={themedStyles.preferenceLeft}>
              <Feather name="lock" size={20} color="#777" />
              <Text style={themedStyles.preferenceText}>Cambiar contraseña</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={themedStyles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color="#fff" />
          <Text style={themedStyles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.configBg,
      paddingTop: 55,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      marginBottom: 20,
    },

    backButton: {
      width: 35,
      height: 35,
      borderRadius: 18,
      backgroundColor: colors.configBackButton,
      justifyContent: 'center',
      alignItems: 'center',
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },

    card: {
      backgroundColor: colors.configCard,
      marginHorizontal: 15,
      marginBottom: 18,
      borderRadius: 18,
      padding: 15,
      elevation: 2,
    },

    sectionTitle: {
      fontWeight: '700',
      marginBottom: 15,
      fontSize: 16,
      color: colors.text,
    },

    profileRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    profileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    avatar: {
      width: 55,
      height: 55,
      borderRadius: 30,
    },

    name: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },

    email: {
      color: colors.configEmail,
      marginTop: 2,
    },

    editButton: {
      backgroundColor: colors.configEditButton,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
    },

    editText: {
      fontSize: 13,
      color: colors.text,
    },

    preferenceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },

    preferenceLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    icon: {
      fontSize: 16,
    },

    preferenceText: {
      fontSize: 14,
      color: colors.text,
    },

    tempButtons: {
      flexDirection: 'row',
      backgroundColor: colors.configButtonGroup,
      borderRadius: 10,
      overflow: 'hidden',
    },

    activeTemp: {
      backgroundColor: colors.configActiveButton,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },

    activeTempText: {
      fontWeight: '600',
      color: colors.text,
    },

    tempButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },

    themeContainer: {
      flexDirection: 'row',
      backgroundColor: colors.configButtonGroup,
      borderRadius: 10,
      overflow: 'hidden',
    },

    activeTheme: {
      backgroundColor: colors.configActiveButton,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    activeThemeText: {
      fontWeight: '600',
      color: colors.text,
    },

    themeButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    logoutButton: {
      backgroundColor: colors.configLogoutBg,
      marginHorizontal: 20,
      marginTop: 25,
      marginBottom: 120,
      borderRadius: 12,
      paddingVertical: 14,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },

    logoutText: {
      color: colors.configLogoutText,
      fontWeight: '600',
    },
  });
}
