import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

import { getGarmentsByUser } from '../src/services/garment.service';
import { ensureSignedIn } from '../src/services/auth.service';
import { useTheme } from '../src/context/ThemeContext';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS_MS = 30 * 24 * 60 * 60 * 1000;

function computeColorDistribution(garments) {
  const colorMap = {};
  for (const g of garments) {
    const name = g.color_name || g.color_hex || 'Otro';
    colorMap[name] = (colorMap[name] || 0) + 1;
  }

  const total = garments.length || 1;
  const entries = Object.entries(colorMap)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return entries;
}

function computeForgottenGarments(garments) {
  const sixMonthsAgo = Date.now() - 6 * MONTHS_MS;
  return garments.filter((g) => {
    if (!g.last_used_at && g.times_used === 0) return true;
    const lastUsed = g.last_used_at?.toDate?.() || new Date(g.last_used_at || 0);
    return lastUsed.getTime() < sixMonthsAgo;
  });
}

export default function StatisticsScreen() {
  const { colors } = useTheme();
  const themedStyles = useMemo(() => getStyles(colors), [colors]);

  const [garments, setGarments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadStats();
    return () => { mountedRef.current = false; };
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const userId = await ensureSignedIn();
      const allGarments = await getGarmentsByUser(userId);
      if (mountedRef.current) setGarments(allGarments);
    } catch (err) {
      console.warn('[Stats] Error:', err.message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={themedStyles.container}>
        <View style={themedStyles.header}>
          <Ionicons name="shirt-outline" size={26} color="#000" />
          <Text style={themedStyles.headerTitle}>ESTADÍSTICAS</Text>
          <Feather name="more-horizontal" size={26} color="#000" />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#999" />
        </View>
      </View>
    );
  }

  const colorDistribution = computeColorDistribution(garments);
  const forgotten = computeForgottenGarments(garments);
  const totalGarments = garments.length;

  const maxTimesUsed = Math.max(...garments.map((g) => g.times_used || 0), 1);
  const barHeights = DAYS.map((_, i) => {
    const dayGarments = garments.filter((g) => {
      if (!g.last_used_at) return false;
      const d = g.last_used_at?.toDate?.() || new Date(g.last_used_at);
      return d.getDay() === (i + 1) % 7;
    });
    const count = dayGarments.reduce((s, g) => s + (g.times_used || 0), 0);
    return Math.max(20, Math.min(160, Math.round((count / Math.max(maxTimesUsed, 1)) * 140) + 20));
  });

  return (
    <View style={themedStyles.container}>

      <View style={themedStyles.header}>
        <Ionicons name="shirt-outline" size={26} color="#000" />
        <Text style={themedStyles.headerTitle}>ESTADÍSTICAS</Text>
        <Feather name="more-horizontal" size={26} color="#000" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={themedStyles.topCards}>

          <View style={themedStyles.card}>
            <Text style={themedStyles.cardTitle}>USO DE PRENDAS</Text>

            <View style={themedStyles.chartContainer}>
              {DAYS.map((day, i) => (
                <View key={day} style={themedStyles.barGroup}>
                  <View style={[i >= 5 ? themedStyles.barPink : themedStyles.bar, { height: barHeights[i] }]} />
                  <Text style={themedStyles.day}>{day}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={themedStyles.card}>
            <Text style={themedStyles.cardTitle}>DISTRIBUCIÓN DE COLORES</Text>

            <View style={themedStyles.circleContainer}>
              <View style={themedStyles.circle}>
                <View style={themedStyles.innerCircle}>
                  <Text style={themedStyles.totalText}>TOTAL</Text>
                  <Text style={themedStyles.totalText}>PRENDAS</Text>
                  <Text style={themedStyles.numberText}>{totalGarments}</Text>
                </View>
              </View>
            </View>

            <View style={themedStyles.labels}>
              {colorDistribution.slice(0, 4).map((entry) => (
                <Text key={entry.name} style={themedStyles.label}>
                  {entry.pct}% {entry.name}
                </Text>
              ))}
            </View>
          </View>

        </View>

        <View style={themedStyles.bottomCard}>
          <Text style={themedStyles.cardTitle}>PRENDAS OLVIDADAS</Text>
          <Text style={themedStyles.subtitle}>No usados en {'>'} 6 meses</Text>

          {forgotten.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#999', paddingVertical: 20 }}>
              ¡Tus prendas están siendo usadas!
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={themedStyles.clothesRow}
            >
              {forgotten.map((g) => (
                <View key={g.id} style={themedStyles.clotheCard}>
                  <Image
                    source={{ uri: g.image_url || 'https://via.placeholder.com/80' }}
                    style={themedStyles.clotheImage}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

      </ScrollView>

    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.statsBg,
      paddingTop: 55,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 25,
    },

    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },

    tabs: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
      borderBottomWidth: 1,
      borderColor: colors.statsTabBorder,
    },

    activeTab: {
      borderBottomWidth: 2,
      borderColor: colors.statsActiveTabBorder,
      paddingBottom: 10,
      width: '50%',
      alignItems: 'center',
    },

    activeTabText: {
      fontWeight: '700',
      fontSize: 16,
      color: colors.text,
    },

    tabText: {
      color: colors.statsTabText,
      fontSize: 16,
      paddingTop: 2,
    },

    topCards: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
    },

    card: {
      backgroundColor: colors.statsCard,
      width: '48%',
      borderRadius: 25,
      padding: 15,
      elevation: 2,
    },

    cardTitle: {
      textAlign: 'center',
      fontWeight: '700',
      fontSize: 16,
      marginBottom: 5,
      color: colors.text,
    },

    subtitle: {
      textAlign: 'center',
      color: colors.statsSubtitle,
      marginBottom: 15,
    },

    chartContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 180,
      marginTop: 10,
    },

    barGroup: {
      alignItems: 'center',
    },

    bar: {
      width: 18,
      backgroundColor: colors.statsBarColor,
      borderRadius: 10,
    },

    barPink: {
      width: 18,
      backgroundColor: colors.statsBarPink,
      borderRadius: 10,
    },

    day: {
      marginTop: 8,
      fontSize: 12,
      color: colors.textTertiary,
    },

    circleContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },

    circle: {
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: colors.statsCircle,
      justifyContent: 'center',
      alignItems: 'center',
    },

    innerCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.statsCircleInner,
      justifyContent: 'center',
      alignItems: 'center',
    },

    totalText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },

    numberText: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },

    labels: {
      marginTop: 15,
      gap: 4,
    },

    label: {
      fontSize: 12,
      color: colors.statsLabel,
    },

    bottomCard: {
      backgroundColor: colors.statsCard,
      margin: 15,
      borderRadius: 25,
      padding: 18,
      elevation: 2,
      marginBottom: 100,
    },

    clothesRow: {
      marginTop: 10,
      gap: 12,
    },

    clotheCard: {
      backgroundColor: colors.statsForgottenCard,
      borderRadius: 18,
      padding: 10,
    },

    clotheImage: {
      width: 70,
      height: 90,
      borderRadius: 12,
    },
  });
}
