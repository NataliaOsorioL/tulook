import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Platform, View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import {
  createGarment, uploadGarmentImage, createGarmentFromEmoji,
} from '../src/services/garment.service';
import { ensureSignedIn } from '../src/services/auth.service';
import { useGarments } from '../src/hooks/useGarments';
import { GARMENT_CATEGORIES, GARMENT_CATEGORIES_LABELS } from '../src/utils/constants';
import { useTheme } from '../src/context/ThemeContext';

const EMOJI_BY_CATEGORY = {
  [GARMENT_CATEGORIES.TOP]: ['👕', '👚', '🧥', '👔'],
  [GARMENT_CATEGORIES.BOTTOM]: ['👖', '🩳'],
  [GARMENT_CATEGORIES.DRESS]: ['👗', '👘'],
  [GARMENT_CATEGORIES.SHOES]: ['👟', '👠', '🥾'],
  [GARMENT_CATEGORIES.ACCESSORY]: ['👜', '🧢', '🕶️', '⌚'],
};

function buildInfo(garment) {
  const parts = [];
  if (garment.quantity != null) parts.push(`Ctdad: ${garment.quantity}`);
  if (garment.size) parts.push(`Talla: ${garment.size}`);
  return parts.join(' | ') || '—';
}

const InventarioScreen = () => {
  const { colors } = useTheme();
  const themedStyles = useMemo(() => getStyles(colors), [colors]);

  const { allGarments, isLoading, refresh, deleteGarment, deleteAllGarments } = useGarments();

  const [activeTab, setActiveTab] = useState('PRENDAS');
  const [showModal, setShowModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(GARMENT_CATEGORIES.TOP);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const mountedRef = useRef(true);

  const getColor = (hex) => {
    if (!hex || hex === 'multi') return colors.inventoryColorDotFallback;
    return hex;
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setShowEmojiPicker(false);
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar fotos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled || !result.assets?.[0]) return;

      handleCloseModal();
      setIsProcessing(true);

      const userId = await ensureSignedIn();
      const uploaded = await uploadGarmentImage(userId, result.assets[0].uri);
      await createGarment(userId, {
        name: 'Prenda',
        category: GARMENT_CATEGORIES.TOP,
        image_url: uploaded.image_url,
        github_path: uploaded.github_path,
        github_sha: uploaded.github_sha,
        quantity: 1,
      });
      refresh();
    } catch (err) {
      console.warn('[Inventory] Error al tomar foto:', err.message);
      Alert.alert('Error', 'No se pudo guardar la prenda. Intenta de nuevo.');
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  };

  const handleOpenEmojiPicker = () => {
    setSelectedEmojiCategory(GARMENT_CATEGORIES.TOP);
    setShowEmojiPicker(true);
  };

  const handleSelectEmoji = async (emoji) => {
    handleCloseModal();
    setIsProcessing(true);
    try {
      const userId = await ensureSignedIn();
      await createGarmentFromEmoji(userId, emoji, selectedEmojiCategory);
      refresh();
    } catch (err) {
      console.warn('[Inventory] Error al crear prenda:', err.message);
      Alert.alert('Error', 'No se pudo guardar la prenda.');
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  };

  const handleDeleteGarment = useCallback((garment) => {
    if (isDeleting) return;
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('¿Estás segura de eliminar esta prenda? Esta acción no se puede deshacer.');
      if (!confirmed) return;
      setIsDeleting(true);
      deleteGarment(garment.id).then(() => {
        setIsDeleting(false);
        refresh();
        window.alert('Prenda eliminada');
      });
    } else {
      Alert.alert(
        'Eliminar prenda',
        '¿Estás segura de que deseas eliminar esta prenda de tu closet?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar', style: 'destructive', onPress: async () => {
              setIsDeleting(true);
              await deleteGarment(garment.id);
              setIsDeleting(false);
              Alert.alert('', 'La prenda fue eliminada correctamente');
            },
          },
        ],
      );
    }
  }, [isDeleting, deleteGarment, refresh]);

  const handleDeleteAll = useCallback(() => {
    if (isDeleting || allGarments.length === 0) return;
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('¿Estás segura de eliminar TODAS las prendas de tu closet? Esta acción no se puede deshacer.');
      if (!confirmed) return;
      setIsDeleting(true);
      deleteAllGarments().then(() => {
        setIsDeleting(false);
        refresh();
        window.alert('Closet eliminado');
      });
    } else {
      Alert.alert(
        'Vaciar closet',
        'Se eliminarán permanentemente todas tus prendas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar', style: 'destructive', onPress: () => {
              Alert.alert(
                '¿Estás completamente segura?',
                'Esta acción eliminará TODO tu inventario y no se puede deshacer.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Sí, eliminar todo', style: 'destructive', onPress: async () => {
                      setIsDeleting(true);
                      await deleteAllGarments();
                      setIsDeleting(false);
                      Alert.alert('', 'Tu closet fue actualizado correctamente');
                    },
                  },
                ],
              );
            },
          },
        ],
      );
    }
  }, [isDeleting, allGarments, deleteAllGarments, refresh]);

  const renderItem = ({ item }) => {
    return (
      <View style={themedStyles.card}>
        <TouchableOpacity
          style={themedStyles.deleteButton}
          onPress={() => {
            handleDeleteGarment(item);
          }}
          disabled={isDeleting}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={14} color={isDeleting ? '#CCC' : '#C0392B'} />
        </TouchableOpacity>

      <View style={[themedStyles.colorDot, { backgroundColor: getColor(item.color_hex) }]} />

      <View style={themedStyles.imagePlaceholder}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={themedStyles.garmentImage} />
        ) : (
          <Text style={{ fontSize: 36 }}>{item.emoji || '👕'}</Text>
        )}
      </View>

      <Text style={themedStyles.itemName} numberOfLines={1}>{item.name}</Text>
      <Text style={themedStyles.itemInfo}>{buildInfo(item)}</Text>
    </View>
  );
  };

  // --------- Loading state (initial load only) ----------
  if (isLoading && allGarments.length === 0) {
    return (
      <SafeAreaView style={themedStyles.container}>
        <View style={themedStyles.header}>
          <Ionicons name="shirt-outline" size={28} color="#555" />
          <Text style={themedStyles.headerTitle}>INVENTARIO</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={themedStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#999" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={themedStyles.container}>
      <View style={themedStyles.header}>
        <Ionicons name="shirt-outline" size={28} color="#555" />
        <Text style={themedStyles.headerTitle}>INVENTARIO</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {allGarments.length > 0 && (
            <TouchableOpacity
              onPress={handleDeleteAll}
              disabled={isDeleting}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="trash-bin-outline"
                size={22}
                color={isDeleting ? '#CCC' : '#C0392B'}
              />
            </TouchableOpacity>
          )}
          <View style={{ width: 28 }} />
        </View>
      </View>

      <View style={themedStyles.tabContainer}>
        <TouchableOpacity
          style={[themedStyles.tab, activeTab === 'PRENDAS' && themedStyles.activeTab]}
          onPress={() => setActiveTab('PRENDAS')}
        >
          <Text style={[themedStyles.tabText, activeTab === 'PRENDAS' && themedStyles.activeTabText]}>PRENDAS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[themedStyles.tab, activeTab === 'OUTFITS' && themedStyles.activeTab]}
          onPress={() => setActiveTab('OUTFITS')}
        >
          <Text style={[themedStyles.tabText, activeTab === 'OUTFITS' && themedStyles.activeTabText]}>OUTFITS</Text>
        </TouchableOpacity>
      </View>

      {allGarments.length === 0 ? (
        <View style={themedStyles.emptyContainer}>
          <Ionicons name="shirt-outline" size={60} color="#DDD" />
          <Text style={themedStyles.emptyText}>Aún no tienes prendas</Text>
          <Text style={themedStyles.emptySubtext}>Agrega tu primera prenda</Text>
        </View>
      ) : (
        <FlatList
          data={allGarments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          extraData={isDeleting}
          contentContainerStyle={themedStyles.listContent}
          columnWrapperStyle={themedStyles.columnWrapper}
        />
      )}

      {isDeleting && (
        <View style={themedStyles.deletingOverlay}>
          <ActivityIndicator size="small" color="#FFF" />
          <Text style={themedStyles.deletingText}>Eliminando...</Text>
        </View>
      )}

      <TouchableOpacity
        style={[themedStyles.fab, isDeleting && { opacity: 0.4 }]}
        onPress={handleOpenModal}
        activeOpacity={0.85}
        disabled={isDeleting}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={themedStyles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <View style={themedStyles.modalContent}>
            {!showEmojiPicker ? (
              <>
                <TouchableOpacity
                  style={themedStyles.modalOption}
                  onPress={handleTakePhoto}
                  disabled={isProcessing}
                >
                  <Ionicons name="camera-outline" size={24} color={colors.text} />
                  <Text style={themedStyles.modalOptionText}>Tomar foto</Text>
                </TouchableOpacity>

                <View style={themedStyles.modalDivider} />

                <TouchableOpacity
                  style={themedStyles.modalOption}
                  onPress={handleOpenEmojiPicker}
                  disabled={isProcessing}
                >
                  <Text style={{ fontSize: 24 }}>👕</Text>
                  <Text style={themedStyles.modalOptionText}>Elegir emoji</Text>
                </TouchableOpacity>

                {isProcessing && (
                  <ActivityIndicator
                    size="small"
                    color={colors.textTertiary}
                    style={{ marginTop: 12 }}
                  />
                )}
              </>
            ) : (
              <>
                <Text style={themedStyles.modalTitle}>Elige un emoji</Text>

                <View style={themedStyles.categoryRow}>
                  {Object.entries(GARMENT_CATEGORIES_LABELS).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        themedStyles.categoryChip,
                        selectedEmojiCategory === key && themedStyles.categoryChipActive,
                      ]}
                      onPress={() => setSelectedEmojiCategory(key)}
                    >
                      <Text
                        style={[
                          themedStyles.categoryChipText,
                          selectedEmojiCategory === key && themedStyles.categoryChipTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={themedStyles.emojiGrid}>
                  {EMOJI_BY_CATEGORY[selectedEmojiCategory].map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={themedStyles.emojiItem}
                      onPress={() => handleSelectEmoji(emoji)}
                    >
                      <Text style={{ fontSize: 32 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 80,
    },
    emptyText: {
      fontSize: 16,
      color: colors.inventoryEmptyText,
      marginTop: 16,
      fontWeight: '600',
    },
    emptySubtext: {
      fontSize: 13,
      color: colors.inventoryEmptySubtext,
      marginTop: 4,
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.inventoryTabBorder,
      marginBottom: 10,
    },
    tab: {
      flex: 1,
      paddingVertical: 15,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.inventoryTabActiveBorder,
    },
    tabText: {
      fontSize: 14,
      color: colors.inventoryTabText,
      fontWeight: '600',
    },
    activeTabText: {
      color: colors.inventoryTabActiveText,
    },
    listContent: {
      paddingHorizontal: 10,
      paddingBottom: 20,
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    card: {
      backgroundColor: colors.inventoryCard,
      width: '31%',
      aspectRatio: 0.85,
      borderRadius: 20,
      padding: 10,
      marginBottom: 15,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        web: { boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
        default: {
          shadowColor: colors.inventoryCardShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
        },
      }),
    },
    deleteButton: {
      position: 'absolute',
      top: 6,
      left: 6,
      zIndex: 10,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      position: 'absolute',
      top: 10,
      right: 10,
      borderWidth: 0.5,
      borderColor: colors.inventoryColorDotBorder,
    },
    imagePlaceholder: {
      width: '100%',
      height: '60%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    garmentImage: {
      width: '100%',
      height: '100%',
      borderRadius: 10,
    },
    itemName: {
      fontSize: 11,
      fontWeight: 'bold',
      marginTop: 5,
      textAlign: 'center',
      color: colors.text,
    },
    itemInfo: {
      fontSize: 9,
      color: colors.inventoryInfoText,
      marginTop: 2,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#E67E22',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      ...Platform.select({
        web: { boxShadow: '0 3px 6px rgba(0,0,0,0.3)' },
        default: {
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        },
      }),
    },
    deletingOverlay: {
      position: 'absolute',
      bottom: 100,
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    deletingText: {
      color: '#FFF',
      fontSize: 13,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingVertical: 24,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 8,
    },
    modalOptionText: {
      fontSize: 16,
      marginLeft: 12,
      color: colors.text,
    },
    modalDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 16,
      color: colors.text,
    },
    categoryRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    categoryChip: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipActive: {
      backgroundColor: '#E67E22',
      borderColor: '#E67E22',
    },
    categoryChipText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    categoryChipTextActive: {
      color: '#FFF',
      fontWeight: '700',
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    emojiItem: {
      padding: 10,
      margin: 4,
      borderRadius: 12,
      backgroundColor: colors.card,
    },
  });
}

export default InventarioScreen;