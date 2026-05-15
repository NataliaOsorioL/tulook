import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { updateUserProfile } from './user.service';
import { ensureSignedIn } from './auth.service';

const STORAGE_KEY = '@tulook_notifications_enabled';
const CHANNEL_ID = 'tulook-general';

let enabledCache = true;
const isExpoGo = Constants.executionEnvironment === 'storeClient';
const hasNativeNotifications = !isExpoGo || Platform.OS !== 'android';

let Notifications = null;
if (hasNativeNotifications) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    Notifications = null;
  }
}

export function isEnabled() {
  return enabledCache;
}

export function getCachedFlag() {
  return enabledCache;
}

export async function setupChannel() {
  if (!Notifications || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Notificaciones TULOOK',
      importance: 3,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  } catch { /* no-op */ }
}

export async function requestPermission() {
  if (!Notifications) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function loadPersistedFlag() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored !== null) enabledCache = stored === 'true';
  } catch { /* no-op */ }
  return enabledCache;
}

export async function setEnabled(value) {
  enabledCache = value;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value.toString());
    const userId = await ensureSignedIn();
    await updateUserProfile(userId, { notifications: value });
  } catch { /* persistencia secundaria, no bloquea */ }
}

export async function enable() {
  await setupChannel();
  await requestPermission();
  await setEnabled(true);
}

export async function disable() {
  if (Notifications) {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch { /* fallback */ }
  }
  await setEnabled(false);
}

export async function schedule(title, body, trigger) {
  if (!enabledCache || !Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, channelId: CHANNEL_ID, sound: 'default' },
      trigger,
    });
  } catch (e) {
    logger.warn('[Notif] schedule error:', e.message);
  }
}

export const TEMPLATES = {
  NO_OUTFIT_TODAY: {
    title: '¿Qué vas a usar hoy?',
    body: 'Aún no has creado un outfit para hoy. ¡Inspírate con tu clóset!',
  },
  MOST_USED_WEEK: {
    title: 'Prenda favorita de la semana',
    body: 'Revisa qué prenda has usado más esta semana en tus estadísticas.',
  },
  OUTFIT_IDEA: {
    title: 'Idea de outfit',
    body: 'Prueba combinar tus prendas de una forma nueva hoy.',
  },
  STYLE_REMINDER: {
    title: 'Recordatorio de estilo',
    body: 'Es hora de actualizar tu look. ¡Revisa tu clóset!',
  },
  COLOR_ALERT: {
    title: '¿Mucho color negro?',
    body: 'Esta semana has usado mucho negro. ¡Prueba un color nuevo!',
  },
};
