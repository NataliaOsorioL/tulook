import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Ionicons name="shirt-outline" size={28} color="#555" />
          <Text style={styles.headerTitle}>INICIO</Text>
          <View style={{ width: 28 }} /> 
        </View>

        <View style={styles.outfitCard}>
          <Text style={styles.cardTitle}>OUTFIT DEL DÍA</Text>
          
          <View style={styles.weatherRow}>
            <Ionicons name="sunny-outline" size={30} color="#E67E22" />
            <Text style={styles.weatherText}>Soleado, 25°C</Text>
          </View>

          <View style={styles.outfitPreview}>
             {/* aquí van las imágenes de las prendas */}
             <View style={styles.placeholderImage} /> 
             <View style={styles.placeholderImage} />
          </View>

          <Text style={styles.outfitDescription}>
            Camisa Lino + Jeans Rectos + Mocasines
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TU CLÓSET</Text>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>PRENDAS RECIENTES</Text>
          <View style={styles.recentGrid}>
            <View style={styles.itemSquare} />
            <View style={styles.itemSquare} />
            <View style={styles.itemSquare} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7F2', 
  },
  scrollContent: {
    padding: 20,
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
  },
  outfitCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 30,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  weatherText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
  },
  outfitDescription: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  recentSection: {
    backgroundColor: '#D1E0EB', 
    borderRadius: 25,
    padding: 20,
  },
  recentTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  recentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemSquare: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 15,
  }
});

export default HomeScreen;