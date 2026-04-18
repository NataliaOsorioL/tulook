import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Datos de ejemplo para las tarjetas
const DATA = [
  { id: '1', name: 'Camisa Lino', color: '#FFF', info: 'Ctdad: 1 | Talla: M' },
  { id: '2', name: 'Jeans Rectos', color: '#2E5A88', info: 'Ctdad: 1 | Talla: M' },
  { id: '3', name: 'Vestido Floral', color: 'multi', info: 'Ctdad: 1 | Talla: M' },
  { id: '4', name: 'Chaqueta Café', color: '#A67B5B', info: 'Ctdad: 1 | Talla: M' },
  { id: '5', name: 'Jackets', color: '#7BA3BE', info: 'Ctdad: 1 | Talla: M' },
  { id: '6', name: 'Jeans Bino', color: '#88A498', info: 'Ctdad: 1 | Talla: M' },
  // Agrega más según necesites...
];

const InventarioScreen = () => {
  const [activeTab, setActiveTab] = useState('PRENDAS');

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.colorDot, { backgroundColor: item.color === 'multi' ? '#FFD700' : item.color }]} />
      
      {/* Placeholder para la imagen de la prenda */}
      <View style={styles.imagePlaceholder}>
        <Ionicons name="shirt-outline" size={40} color="#CCC" />
      </View>

      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.itemInfo}>{item.info}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shirt-outline" size={28} color="#555" />
        <Text style={styles.headerTitle}>INVENTARIO</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Selector de Pestañas (PRENDAS | OUTFITS) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'PRENDAS' && styles.activeTab]} 
          onPress={() => setActiveTab('PRENDAS')}
        >
          <Text style={[styles.tabText, activeTab === 'PRENDAS' && styles.activeTabText]}>PRENDAS</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'OUTFITS' && styles.activeTab]} 
          onPress={() => setActiveTab('OUTFITS')}
        >
          <Text style={[styles.tabText, activeTab === 'OUTFITS' && styles.activeTabText]}>OUTFITS</Text>
        </TouchableOpacity>
      </View>

      {/* Grid de productos */}
      <FlatList
        data={DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7F2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#555',
  },
  tabText: {
    fontSize: 14,
    color: '#AAA',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFF',
    width: '31%',
    aspectRatio: 0.85,
    borderRadius: 20,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 10,
    right: 10,
    borderWidth: 0.5,
    borderColor: '#DDD',
  },
  imagePlaceholder: {
    width: '100%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  itemInfo: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
});

export default InventarioScreen;