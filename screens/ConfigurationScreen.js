import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert, Modal, Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import SafeImage from '../src/components/SafeImage';
import { logger } from '../src/utils/logger';
import { getUserProfile, updateUserProfile } from '../src/services/user.service';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadPersistedFlag, setupChannel, enable, disable } from '../src/services/notification.service';

export default function SettingsScreen() {
  const { themeMode, setThemeMode, colors } = useTheme();
  const navigation = useNavigation();
  const { logout, userId, changePassword } = useAuth();
  const insets = useSafeAreaInsets();
  const themedStyles = useMemo(() => getStyles(colors, insets), [colors, insets]);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [temperatureUnit, setTemperatureUnit] = useState('C');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadProfile();
    setupChannel();
    loadPersistedFlag();
    return () => { mountedRef.current = false; };
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getUserProfile(userId);
      if (data && mountedRef.current) {
        setProfile(data);
        setNotifications(data.notifications ?? true);
        setTemperatureUnit(data.temperature_unit || 'C');
        setThemeMode(data.theme || 'light');
      }
    } catch (err) {
      logger.warn('[Config] Error:', err.message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  const savePreference = async (updates) => {
    try {
      setIsSaving(true);
      await updateUserProfile(userId, updates);
    } catch (err) {
      logger.warn('[Config] Error al guardar:', err.message);
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

  const handleNotificationsChange = async (value) => {
    setNotifications(value);
    try {
      if (value) {
        await enable();
      } else {
        await disable();
      }
    } catch {
      setNotifications(!value);
    }
  };

  const executeLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      if (mountedRef.current) {
        Alert.alert('Error', 'No se pudo cerrar la sesion. Intenta de nuevo.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoggingOut(false);
      }
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const shouldLogout = window.confirm('Estas seguro de que deseas cerrar sesion?');
      if (shouldLogout) {
        await executeLogout();
      }
      return;
    }

    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: executeLogout,
        },
      ],
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!currentPassword) {
      Alert.alert('Campo requerido', 'Ingresa tu contraseña actual.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Contraseña nueva', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setShowPasswordModal(false);
      Alert.alert('Éxito', 'Contraseña actualizada correctamente.');
    } catch (err) {
      const msg = err.code === 'auth/wrong-password'
        ? 'La contraseña actual es incorrecta.'
        : err.code === 'auth/requires-recent-login'
          ? 'Debes iniciar sesión de nuevo para cambiar la contraseña.'
          : err.code === 'auth/weak-password'
            ? 'La nueva contraseña debe tener al menos 6 caracteres.'
            : err.message || 'No se pudo cambiar la contraseña. Intenta de nuevo.';
      Alert.alert('Error', msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <View style={themedStyles.container}>
        <View style={themedStyles.header}>
          <TouchableOpacity style={themedStyles.backButton} onPress={() => navigation.goBack()}>
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
          <TouchableOpacity style={themedStyles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={themedStyles.headerTitle}>Configuración</Text>
          <View style={{ width: 35 }} />
        </View>

        <View style={themedStyles.card}>
          <Text style={themedStyles.sectionTitle}>Perfil</Text>

          <View style={themedStyles.profileRow}>
            <View style={themedStyles.profileInfo}>
              <SafeImage
                uri={profile?.avatar_url}
                style={themedStyles.avatar}
                iconName="person-outline"
                iconSize={22}
                bgColor={colors.configBackButton}
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

        <TouchableOpacity
          style={[themedStyles.logoutButton, isLoggingOut && themedStyles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="logout" size={18} color="#fff" />
              <Text style={themedStyles.logoutText}>Cerrar sesión</Text>
            </>
          )}
        </TouchableOpacity>

        <Modal
          visible={showPasswordModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={themedStyles.passwordOverlay}>
            <View style={themedStyles.passwordContent}>
              <Text style={themedStyles.passwordTitle}>Cambiar contraseña</Text>

              <Text style={themedStyles.passwordLabel}>Contraseña actual</Text>
              <TextInput
                style={themedStyles.passwordInput}
                placeholder="Ingresa tu contraseña actual"
                placeholderTextColor="#999"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />

              <Text style={themedStyles.passwordLabel}>Nueva contraseña</Text>
              <TextInput
                style={themedStyles.passwordInput}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#999"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={themedStyles.passwordLabel}>Confirmar nueva contraseña</Text>
              <TextInput
                style={themedStyles.passwordInput}
                placeholder="Repite la nueva contraseña"
                placeholderTextColor="#999"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <View style={themedStyles.passwordButtons}>
                <TouchableOpacity
                  style={themedStyles.passwordCancelBtn}
                  onPress={() => setShowPasswordModal(false)}
                  disabled={isChangingPassword}
                >
                  <Text style={themedStyles.passwordCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[themedStyles.passwordSubmitBtn, isChangingPassword && { opacity: 0.6 }]}
                  onPress={handlePasswordSubmit}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={themedStyles.passwordSubmitText}>Cambiar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </View>
  );
}

function getStyles(colors, insets = { top: 0 }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.configBg,
      paddingTop: insets.top + 10,
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
      marginBottom: Math.max(insets.bottom + 20, 100),
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

    logoutButtonDisabled: {
      opacity: 0.7,
    },

    passwordOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    passwordContent: {
      backgroundColor: colors.card || '#FFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: Math.max((insets?.bottom || 0) + 24, 32),
    },
    passwordTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    passwordLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary || '#666',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    passwordInput: {
      borderWidth: 1,
      borderColor: colors.border || '#E0E0E0',
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 15,
      color: colors.text,
      marginBottom: 16,
    },
    passwordButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    passwordCancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border || '#E0E0E0',
      alignItems: 'center',
    },
    passwordCancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary || '#666',
    },
    passwordSubmitBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: '#529BD6',
      alignItems: 'center',
    },
    passwordSubmitText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFF',
    },
  });
}
