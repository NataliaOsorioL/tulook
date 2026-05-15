import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  Platform, View, Text, StyleSheet, Image, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';

import { getHomeDashboard } from '../src/services/home.service';
import { ensureSignedIn } from '../src/services/auth.service';
import { logger } from '../src/utils/logger';
import { useTheme } from '../src/context/ThemeContext';

const HomeScreen = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const themedStyles = useMemo(() => getStyles(colors, insets.top), [colors, insets.top]);

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;

      const loadDashboard = async () => {
        try {
          setIsLoading(true);

          const userId = await ensureSignedIn();

          let location = null;
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Low,
              });
              location = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              };
            }
          } catch {
            // location unavailable, proceed without it
          }

          const data = await getHomeDashboard(userId, location);
          if (mountedRef.current) {
            setDashboardData(data);
          }
        } catch (err) {
          if (mountedRef.current) {
            logger.warn('HomeDashboard error:', err.message);
          }
        } finally {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        }
      };

      loadDashboard();

      return () => {
        mountedRef.current = false;
      };
    }, []),
  );

  if (isLoading && !dashboardData) {
    return (
      <View style={[themedStyles.container, { paddingTop: insets.top }]}>
        <View style={themedStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#999" />
        </View>
      </View>
    );
  }

  const weather = dashboardData?.weather;
  const outfit = dashboardData?.outfit_of_the_day;
  const recentGarments = dashboardData?.recent_garments || [];
  const previewImages = outfit?.preview_images || [];

  return (
    <View style={[themedStyles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={themedStyles.scrollContent}>

        <View style={themedStyles.header}>
          <Ionicons name="shirt-outline" size={28} color="#555" />
          <Text style={themedStyles.headerTitle}>INICIO</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={themedStyles.outfitCard}>
          <Text style={themedStyles.cardTitle}>OUTFIT DEL DÍA</Text>

          <View style={themedStyles.weatherRow}>
            <Ionicons
              name={weather?.icon || 'sunny-outline'}
              size={30}
              color="#E67E22"
            />
            <Text style={themedStyles.weatherText}>
              {weather?.text || 'Soleado, 25°C'}
            </Text>
          </View>

          <View style={themedStyles.outfitPreview}>
            {previewImages[0] ? (
              <Image source={{ uri: previewImages[0] }} style={themedStyles.placeholderImage} />
            ) : (
              <View style={themedStyles.placeholderImage} />
            )}
            {previewImages[1] ? (
              <Image source={{ uri: previewImages[1] }} style={themedStyles.placeholderImage} />
            ) : (
              <View style={themedStyles.placeholderImage} />
            )}
          </View>

          <Text style={themedStyles.outfitDescription}>
            {outfit?.description || 'Camisa Lino + Jeans Rectos + Mocasines'}
          </Text>
        </View>

        <View style={themedStyles.sectionHeader}>
          <Text style={themedStyles.sectionTitle}>TU CLÓSET</Text>
        </View>

        <View style={themedStyles.recentSection}>
          <Text style={themedStyles.recentTitle}>PRENDAS RECIENTES</Text>
          <View style={themedStyles.recentGrid}>
            {[0, 1, 2].map((index) => {
              const item = recentGarments[index];
              return (
                <View key={index} style={themedStyles.itemSquare}>
                  {item?.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={themedStyles.itemSquareImage}
                    />
                  ) : item?.emoji ? (
                    <View style={themedStyles.itemSquareEmojiWrap}>
                      <Text style={themedStyles.itemSquareEmoji}>{item.emoji}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

function getStyles(colors, insetsTop = 0) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.text,
    },
    outfitCard: {
      backgroundColor: colors.homeOutfitCard,
      borderRadius: 20,
      padding: 20,
      ...Platform.select({
        web: { boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
        default: {
          shadowColor: colors.homeShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 3,
        },
      }),
      marginBottom: 30,
    },
    cardTitle: {
      fontWeight: 'bold',
      fontSize: 18,
      marginBottom: 10,
      color: colors.text,
    },
    weatherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    weatherText: {
      marginLeft: 10,
      fontSize: 16,
      color: colors.homeWeatherText,
    },
    outfitPreview: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      height: 150,
      marginVertical: 10,
    },
    placeholderImage: {
      width: 100,
      height: '100%',
      backgroundColor: colors.homePlaceholderBg,
      borderRadius: 10,
    },
    itemSquareImage: {
      width: 80,
      height: 80,
      borderRadius: 15,
    },
    itemSquareEmojiWrap: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemSquareEmoji: {
      fontSize: 34,
      color: colors.text,
    },
    outfitDescription: {
      marginTop: 15,
      fontSize: 14,
      color: colors.homeDescriptionText,
      fontStyle: 'italic',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
      color: colors.text,
    },
    recentSection: {
      backgroundColor: colors.homeRecentSection,
      borderRadius: 25,
      padding: 20,
    },
    recentTitle: {
      textAlign: 'center',
      fontWeight: 'bold',
      marginBottom: 15,
      letterSpacing: 0.5,
      color: colors.text,
    },
    recentGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    itemSquare: {
      width: 80,
      height: 80,
      backgroundColor: colors.homeRecentSquare,
      borderRadius: 15,
    },
  });
}

export default HomeScreen;
