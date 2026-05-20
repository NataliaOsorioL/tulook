import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  Platform, View, Text, TextInput, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, Modal, Alert, ScrollView, KeyboardAvoidingView, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import {
  createGarment, uploadGarmentImage, createGarmentFromEmoji,
} from '../src/services/garment.service';
import { useGarments } from '../src/hooks/useGarments';
import { useOutfits } from '../src/hooks/useOutfits';
import { logger } from '../src/utils/logger';
import { useAuth } from '../src/context/AuthContext';
import { GARMENT_CATEGORIES, GARMENT_CATEGORIES_LABELS, GARMENT_TYPES } from '../src/utils/constants';
import { useTheme } from '../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMOJI_BY_CATEGORY = {
  [GARMENT_CATEGORIES.TOP]: ['👕', '👚', '🧥', '👔'],
  [GARMENT_CATEGORIES.BOTTOM]: ['👖', '🩳'],
  [GARMENT_CATEGORIES.DRESS]: ['👗', '👘'],
  [GARMENT_CATEGORIES.SHOES]: ['👟', '👠', '🥾'],
  [GARMENT_CATEGORIES.ACCESSORY]: ['👜', '🧢', '🕶️', '⌚'],
};

const DEFAULT_SUBTYPE_BY_EMOJI = {
  '👕': 'Camisa',
  '👚': 'Blusa',
  '🧥': 'Chamarra',
  '👔': 'Camisa',
  '👖': 'Jean',
  '🩳': 'Short',
  '👗': 'Vestido corto',
  '👘': 'Mono',
  '👟': 'Tenis',
  '👠': 'Tacones',
  '🥾': 'Botas',
  '👜': 'Bolso',
  '🧢': 'Gorra',
  '🕶️': 'Lentes',
  '⌚': 'Reloj',
};

const getCategoryForEmoji = (emoji) => {
  for (const [category, emojis] of Object.entries(EMOJI_BY_CATEGORY)) {
    if (emojis.includes(emoji)) {
      return category;
    }
  }
  return GARMENT_CATEGORIES.TOP;
};

const COLOR_OPTIONS = [
  { hex: '#FF6B6B', name: 'Rojo' },
  { hex: '#FFA94D', name: 'Naranja' },
  { hex: '#FFD43B', name: 'Amarillo' },
  { hex: '#69DB7C', name: 'Verde' },
  { hex: '#4DABF7', name: 'Azul' },
  { hex: '#9775FA', name: 'Púrpura' },
  { hex: '#F783AC', name: 'Rosa' },
  { hex: '#C0C0C0', name: 'Plata' },
  { hex: '#F8F9FA', name: 'Blanco' },
  { hex: '#495057', name: 'Gris Oscuro' },
  { hex: '#212529', name: 'Negro' },
  { hex: '#E9ECEF', name: 'Gris Claro' },
  { hex: '#D4A373', name: 'Beige' },
  { hex: '#A98467', name: 'Marrón' },
  { hex: '#5C940D', name: 'Oliva' },
  { hex: '#A61E24', name: 'Borgoña' },
];

function buildInfo(garment) {
  const parts = [];
  if (garment.subtype) parts.push(garment.subtype);
  if (garment.quantity != null) parts.push(`×${garment.quantity}`);
  return parts.join(' | ') || '—';
}

const InventarioScreen = () => {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const themedStyles = useMemo(() => getStyles(colors, windowHeight, insets), [colors, windowHeight, insets]);

  const { allGarments, isLoading, refresh, deleteGarment, deleteAllGarments } = useGarments();
  const {
    outfits: savedOutfits,
    isLoading: outfitsLoading,
    isDeleting: isDeletingOutfits,
    refresh: refreshOutfits,
    deleteOutfit: deleteSavedOutfit,
    deleteAllOutfits: deleteAllSavedOutfits,
  } = useOutfits();

  const [activeTab, setActiveTab] = useState('PRENDAS');
  const [showModal, setShowModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGarmentForm, setShowGarmentForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(GARMENT_CATEGORIES.TOP);
  const [formCategory, setFormCategory] = useState(GARMENT_CATEGORIES.TOP);
  const [formSubtype, setFormSubtype] = useState('');
  const [formColor, setFormColor] = useState('#CCC');
  const [formCustomColor, setFormCustomColor] = useState('');
  const [formName, setFormName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showOutfitDetail, setShowOutfitDetail] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [pendingGarment, setPendingGarment] = useState(null);
  const mountedRef = useRef(true);



  const getColor = (hex) => {
    if (!hex || hex === 'multi') return colors.inventoryColorDotFallback;
    return hex;
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setShowEmojiPicker(false);
    setShowGarmentForm(false);
    setFormStep(1);
    setPendingGarment(null);
  };

  const handleTakePhoto = async (isRetake = false) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('Se necesita acceso a la cámara para tomar fotos.');
        } else {
          Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar fotos.');
        }
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled || !result.assets?.[0]) {
        return;
      }
      const newPhoto = { type: 'photo', uri: result.assets[0].uri };
      setPendingGarment(newPhoto);
      setImageLoadError(false);
      if (!isRetake) {
        openGarmentForm(GARMENT_CATEGORIES.TOP, '');
      }
    } catch (err) {
      logger.warn('[Inventory] Error al tomar foto:', err.message);
      if (Platform.OS === 'web') {
        window.alert('No se pudo tomar la foto. Intenta de nuevo.');
      } else {
        Alert.alert('Error', 'No se pudo tomar la foto. Intenta de nuevo.');
      }
    }
  };

  const handlePickImageFromGallery = async (isRetake = false) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('Se necesita acceso a la galería para seleccionar fotos.');
        } else {
          Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar fotos.');
        }
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'images',
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled || !result.assets?.[0]) {
        return;
      }
      const newPhoto = { type: 'photo', uri: result.assets[0].uri };
      setPendingGarment(newPhoto);
      setImageLoadError(false);
      if (!isRetake) {
        openGarmentForm(GARMENT_CATEGORIES.TOP, '');
      }
    } catch (err) {
      logger.warn('[Inventory] Error al seleccionar imagen de la galería:', err.message);
      if (Platform.OS === 'web') {
        window.alert('No se pudo seleccionar la imagen. Intenta de nuevo.');
      } else {
        Alert.alert('Error', 'No se pudo seleccionar la imagen. Intenta de nuevo.');
      }
    }
  };

  const handleChangePhoto = () => {
    if (Platform.OS === 'web') {
      const option = window.confirm('¿Quieres elegir desde la galería? (Aceptar para Galería, Cancelar para Cámara)');
      if (option) {
        handlePickImageFromGallery(true);
      } else {
        handleTakePhoto(true);
      }
    } else {
      Alert.alert(
        'Cambiar foto',
        'Selecciona una opción:',
        [
          { text: 'Cámara', onPress: () => handleTakePhoto(true) },
          { text: 'Galería', onPress: () => handlePickImageFromGallery(true) },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    }
  };

  const openGarmentForm = (initialCategory = GARMENT_CATEGORIES.TOP, initialSubtype = '') => {
    setFormCategory(initialCategory);
    setFormSubtype(initialSubtype);
    setFormColor('#CCC');
    setFormCustomColor('');
    setFormName('');
    setFormNotes('');
    setFormStep(1);
    setImageLoadError(false);
    setProcessingLabel('');
    setShowModal(false);
    setShowGarmentForm(true);
  };

  const saveGarment = async () => {
    if (!formSubtype) {
      if (Platform.OS === 'web') {
        window.alert('Selecciona un tipo de prenda');
      } else {
        Alert.alert('Campo requerido', 'Selecciona un tipo de prenda');
      }
      return;
    }
    if (!formCustomColor.trim() && formColor === '#CCC') {
      if (Platform.OS === 'web') {
        window.alert('Selecciona un color');
      } else {
        Alert.alert('Campo requerido', 'Selecciona un color para la prenda');
      }
      return;
    }

    const color = formCustomColor.trim() || formColor;
    const name = formName.trim() || formSubtype;
    const notes = formNotes.trim() || null;

    setShowGarmentForm(false);
    setIsProcessing(true);

    try {
      const pg = pendingGarment;
      if (!pg) return;



      if (pg.type === 'photo') {
        setProcessingLabel('Subiendo imagen...');
        const uploaded = await uploadGarmentImage(userId, pg.uri);
        setProcessingLabel('Guardando prenda...');
        await createGarment(userId, {
          name,
          category: formCategory,
          subtype: formSubtype,
          color_hex: color,
          notes,
          image_url: uploaded.image_url,
          github_path: uploaded.github_path,
          github_sha: uploaded.github_sha,
          quantity: 1,
        });
      } else if (pg.type === 'emoji') {
        setProcessingLabel('Guardando prenda...');
        await createGarmentFromEmoji(userId, pg.emoji, formCategory, color, formSubtype, notes);
      }

      setPendingGarment(null);
      refresh();
    } catch (err) {
      logger.warn('[Inventory] Error al crear prenda:', err.message);
      Alert.alert('Error', 'No se pudo guardar la prenda. Intenta de nuevo.');
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
        setProcessingLabel('');
      }
    }
  };

  const handleOpenEmojiPicker = () => {
    setSelectedEmojiCategory(GARMENT_CATEGORIES.TOP);
    setShowEmojiPicker(true);
  };

  const handleSelectEmoji = (emoji) => {
    const category = getCategoryForEmoji(emoji);
    const subtype = DEFAULT_SUBTYPE_BY_EMOJI[emoji] || '';

    setPendingGarment({ type: 'emoji', emoji, category });
    openGarmentForm(category, subtype);
  };

  const handleDeleteGarment = useCallback(async (garment) => {
    if (isDeleting) return;
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('¿Estás segura de eliminar esta prenda? Esta acción no se puede deshacer.');
      if (!confirmed) return;
      setIsDeleting(true);
      try {
        await deleteGarment(garment.id);
        refresh();
        window.alert('Prenda eliminada');
      } catch (err) {
        logger.warn('[Inventory] Error al eliminar:', err.message);
        window.alert('Error al eliminar: ' + err.message);
      } finally {
        setIsDeleting(false);
      }
    } else {
      Alert.alert(
        'Eliminar prenda',
        '¿Estás segura de que deseas eliminar esta prenda de tu closet?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar', style: 'destructive', onPress: async () => {
              setIsDeleting(true);
              try {
                await deleteGarment(garment.id);
                Alert.alert('', 'La prenda fue eliminada correctamente');
              } catch (err) {
                logger.warn('[Inventory] Error al eliminar:', err.message);
                Alert.alert('Error', 'No se pudo eliminar la prenda: ' + err.message);
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ],
      );
    }
  }, [isDeleting, deleteGarment, refresh]);

  const handleDeleteAll = useCallback(async () => {
    if (activeTab === 'PRENDAS') {
      if (isDeleting || allGarments.length === 0) return;
      if (Platform.OS === 'web') {
        const confirmed = window.confirm('¿Estás segura de eliminar TODAS las prendas? Esta acción no se puede deshacer.');
        if (!confirmed) return;
        setIsDeleting(true);
        try {
          await deleteAllGarments();
          refresh();
          window.alert('Todas las prendas fueron eliminadas.');
        } catch (err) {
          logger.warn('[Inventory] Error al eliminar todo:', err.message);
          window.alert('Error al eliminar: ' + err.message);
        } finally {
          setIsDeleting(false);
        }
      } else {
        Alert.alert(
          'Eliminar prendas',
          '¿Deseas eliminar todas las prendas del inventario?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar todo', style: 'destructive', onPress: () => {
                Alert.alert(
                  '¿Estás segura?',
                  'Esta acción NO se puede deshacer.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Eliminar todo', style: 'destructive', onPress: async () => {
                        setIsDeleting(true);
                        try {
                          await deleteAllGarments();
                          Alert.alert('', 'Todas las prendas fueron eliminadas.');
                        } catch (err) {
                          logger.warn('[Inventory] Error al eliminar todo:', err.message);
                          Alert.alert('Error', 'No se pudieron eliminar las prendas: ' + err.message);
                        } finally {
                          setIsDeleting(false);
                        }
                      },
                    },
                  ],
                );
              },
            },
          ],
        );
      }
    } else {
      if (isDeletingOutfits || savedOutfits.length === 0) return;
      if (Platform.OS === 'web') {
        const confirmed = window.confirm('¿Estás segura de eliminar TODOS los outfits? Esta acción no se puede deshacer.');
        if (!confirmed) return;
        setIsDeleting(true);
        try {
          await deleteAllSavedOutfits();
          refreshOutfits();
          window.alert('Todos los outfits fueron eliminados.');
        } catch (err) {
          logger.warn('[Inventory] Error al eliminar outfits:', err.message);
          window.alert('Error al eliminar: ' + err.message);
        } finally {
          setIsDeleting(false);
        }
      } else {
        Alert.alert(
          'Eliminar outfits',
          '¿Deseas eliminar todos los outfits guardados?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar todo', style: 'destructive', onPress: () => {
                Alert.alert(
                  '¿Estás segura?',
                  'Esta acción NO se puede deshacer.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Eliminar todo', style: 'destructive', onPress: async () => {
                        setIsDeleting(true);
                        try {
                          await deleteAllSavedOutfits();
                          refreshOutfits();
                          Alert.alert('', 'Todos los outfits fueron eliminados.');
                        } catch (err) {
                          logger.warn('[Inventory] Error al eliminar outfits:', err.message);
                          Alert.alert('Error', 'No se pudieron eliminar los outfits: ' + err.message);
                        } finally {
                          setIsDeleting(false);
                        }
                      },
                    },
                  ],
                );
              },
            },
          ],
        );
      }
    }
  }, [isDeleting, isDeletingOutfits, activeTab, allGarments, savedOutfits, deleteAllGarments, deleteAllSavedOutfits, refresh, refreshOutfits]);

  const handleDeleteOutfit = useCallback(async (outfit) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`¿Deseas eliminar el outfit "${outfit.name || 'sin nombre'}"?`);
      if (!confirmed) return;
      try {
        await deleteSavedOutfit(outfit.id);
        window.alert('Outfit eliminado correctamente.');
      } catch (err) {
        logger.warn('[Inventory] Error al eliminar outfit:', err.message);
        window.alert('No se pudo eliminar el outfit. Verifica tu conexión e intenta de nuevo.');
      }
    } else {
      Alert.alert(
        'Eliminar outfit',
        `¿Deseas eliminar "${outfit.name || 'sin nombre'}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar', style: 'destructive', onPress: async () => {
              try {
                await deleteSavedOutfit(outfit.id);
                Alert.alert('', 'Outfit eliminado correctamente.');
              } catch (err) {
                logger.warn('[Inventory] Error al eliminar outfit:', err.message);
                Alert.alert('Error', 'No se pudo eliminar el outfit. Verifica tu conexión e intenta de nuevo.');
              }
            },
          },
        ],
      );
    }
  }, [deleteSavedOutfit]);

  const handleOpenOutfitDetail = useCallback((outfit) => {
    setSelectedOutfit(outfit);
    setShowOutfitDetail(true);
  }, []);

  const handleCloseOutfitDetail = useCallback(() => {
    setShowOutfitDetail(false);
    setSelectedOutfit(null);
  }, []);

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

  const renderOutfitItem = ({ item }) => {
    const garmentCount = item.garments?.length || item.garment_ids?.length || 0;
    const previewGarment = item.garments?.[0];
    const createdDate = item.created_at?.toDate
      ? item.created_at.toDate()
      : item.created_at
        ? new Date(item.created_at)
        : null;
    const dateStr = createdDate
      ? `${createdDate.getDate()}/${createdDate.getMonth() + 1}/${createdDate.getFullYear()}`
      : '';

    return (
      <TouchableOpacity
        style={themedStyles.outfitCard}
        activeOpacity={0.85}
        onPress={() => handleOpenOutfitDetail(item)}
      >
        <TouchableOpacity
          style={themedStyles.outfitDeleteBtn}
          onPress={() => handleDeleteOutfit(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={14} color="#C0392B" />
        </TouchableOpacity>
        <View style={themedStyles.outfitCardPreview}>
          {previewGarment ? (
            <>
              {previewGarment.image_url ? (
                <Image source={{ uri: previewGarment.image_url }} style={themedStyles.outfitCardImage} />
              ) : (
                <Text style={{ fontSize: 32 }}>{previewGarment.emoji || '👕'}</Text>
              )}
            </>
          ) : (
            <Ionicons name="bag-outline" size={28} color="#DDD" />
          )}
        </View>
        <View style={themedStyles.outfitCardInfo}>
          <Text style={themedStyles.outfitCardName} numberOfLines={1}>
            {item.name || 'Outfit'}
          </Text>
          <View style={themedStyles.outfitCardMeta}>
            <Text style={themedStyles.outfitCardCount}>{garmentCount} prendas</Text>
            {dateStr ? (
              <Text style={themedStyles.outfitCardDate}>{dateStr}</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // --------- Loading state (initial load only) ----------
  if (isLoading && allGarments.length === 0) {
    return (
      <View style={themedStyles.container}>
        <View style={themedStyles.header}>
          <Ionicons name="shirt-outline" size={28} color="#555" />
          <Text style={themedStyles.headerTitle}>INVENTARIO</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={themedStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#999" />
        </View>
      </View>
    );
  }

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.header}>
        <Ionicons name="shirt-outline" size={28} color="#555" />
        <Text style={themedStyles.headerTitle}>INVENTARIO</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(activeTab === 'PRENDAS' ? allGarments.length > 0 : savedOutfits.length > 0) && (
            <TouchableOpacity
              onPress={handleDeleteAll}
              disabled={isDeleting}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

      {activeTab === 'PRENDAS' ? (
        allGarments.length === 0 ? (
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
        )
      ) : (
        <>
          {outfitsLoading ? (
            <View style={themedStyles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.textTertiary} />
            </View>
          ) : savedOutfits.length === 0 ? (
            <View style={themedStyles.emptyContainer}>
              <Ionicons name="bag-outline" size={60} color="#DDD" />
              <Text style={themedStyles.emptyText}>Aún no tienes outfits</Text>
              <Text style={themedStyles.emptySubtext}>Crea tu primer outfit desde la pantalla de outfits</Text>
            </View>
          ) : (
            <FlatList
              data={savedOutfits}
              renderItem={renderOutfitItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={themedStyles.outfitListContent}
              columnWrapperStyle={themedStyles.outfitColumnWrapper}
            />
          )}
        </>
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
                  onPress={() => handleTakePhoto(false)}
                  disabled={isProcessing}
                >
                  <Ionicons name="camera-outline" size={24} color={colors.text} />
                  <Text style={themedStyles.modalOptionText}>Tomar foto</Text>
                </TouchableOpacity>

                <View style={themedStyles.modalDivider} />

                <TouchableOpacity
                  style={themedStyles.modalOption}
                  onPress={() => handlePickImageFromGallery(false)}
                  disabled={isProcessing}
                >
                  <Ionicons name="image-outline" size={24} color={colors.text} />
                  <Text style={themedStyles.modalOptionText}>Subir foto (Galería)</Text>
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
                  <View style={{ alignItems: 'center', marginTop: 12 }}>
                    <ActivityIndicator size="small" color={colors.textTertiary} />
                    {processingLabel ? (
                      <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 6 }}>
                        {processingLabel}
                      </Text>
                    ) : null}
                  </View>
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

      <Modal
        visible={showGarmentForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGarmentForm(false)}
        statusBarTranslucent
      >
        <View style={themedStyles.gFormOverlay}>
          <TouchableOpacity
            style={themedStyles.gFormBackdrop}
            activeOpacity={1}
            onPress={handleCloseModal}
          />
          <View style={themedStyles.gFormSheet}>
            <View style={themedStyles.gFormHeader}>
              <Text style={themedStyles.gFormTitle}>Nueva prenda</Text>
              <TouchableOpacity
                style={themedStyles.gFormCloseBtn}
                onPress={handleCloseModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={themedStyles.gFormBody}
              contentContainerStyle={themedStyles.gFormBodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {pendingGarment?.type === 'photo' ? (
                <View style={themedStyles.gFormPreviewWrap}>
                  {imageLoadError ? (
                    <View style={themedStyles.gFormPreviewPlaceholder}>
                      <Ionicons name="image-outline" size={28} color="#CCC" />
                      <Text style={themedStyles.gFormPreviewPlaceholderText}>Error al cargar imagen</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: pendingGarment.uri }}
                      style={themedStyles.gFormPreviewImage}
                      resizeMode="contain"
                      onError={() => setImageLoadError(true)}
                    />
                  )}
                </View>
              ) : pendingGarment?.type === 'emoji' ? (
                <View style={themedStyles.gFormEmojiWrap}>
                  <Text style={themedStyles.gFormEmojiText}>{pendingGarment.emoji}</Text>
                </View>
              ) : null}

              <View style={themedStyles.gFormSteps}>
                <View style={[themedStyles.gFormStepDot, formStep >= 1 && themedStyles.gFormStepDotActive]} />
                <View style={themedStyles.gFormStepLine} />
                <View style={[themedStyles.gFormStepDot, formStep >= 2 && themedStyles.gFormStepDotActive]} />
                <View style={themedStyles.gFormStepLine} />
                <View style={[themedStyles.gFormStepDot, formStep >= 3 && themedStyles.gFormStepDotActive]} />
              </View>

              {formStep === 1 && (
                <View>
                  <Text style={themedStyles.gFormSectionTitle}>Categoría y tipo</Text>
                  <Text style={themedStyles.gFormLabel}>Categoría</Text>
                  <View style={themedStyles.gFormChipRow}>
                    {Object.entries(GARMENT_CATEGORIES_LABELS).map(([key, label]) => (
                      <TouchableOpacity
                        key={key}
                        style={[themedStyles.gFormChip, formCategory === key && themedStyles.gFormChipActive]}
                        onPress={() => { setFormCategory(key); setFormSubtype(''); }}
                      >
                        <Text style={[themedStyles.gFormChipText, formCategory === key && themedStyles.gFormChipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={themedStyles.gFormLabel}>Tipo de prenda</Text>
                  <View style={themedStyles.gFormChipRow}>
                    {GARMENT_TYPES[formCategory].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[themedStyles.gFormChip, formSubtype === type && themedStyles.gFormChipActive]}
                        onPress={() => setFormSubtype(type)}
                      >
                        <Text style={[themedStyles.gFormChipText, formSubtype === type && themedStyles.gFormChipTextActive]}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {formStep === 2 && (
                <View>
                  <Text style={themedStyles.gFormSectionTitle}>Elige un color</Text>
                  <View style={themedStyles.gFormColorGrid}>
                    {COLOR_OPTIONS.map((c) => (
                      <TouchableOpacity
                        key={c.hex}
                        style={[
                          themedStyles.gFormColorSwatch,
                          { backgroundColor: c.hex },
                          formColor === c.hex && themedStyles.gFormColorSwatchSelected,
                          c.hex === '#F8F9FA' && { borderWidth: 1, borderColor: '#DDD' },
                        ]}
                        onPress={() => setFormColor(c.hex)}
                      >
                        {formColor === c.hex && <Ionicons name="checkmark" size={16} color="#FFF" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={themedStyles.gFormColorInputRow}>
                    <Text style={themedStyles.gFormColorLabel}>Personalizado:</Text>
                    <TextInput
                      style={themedStyles.gFormColorInput}
                      placeholder="#HEX"
                      placeholderTextColor="#999"
                      value={formCustomColor}
                      onChangeText={setFormCustomColor}
                      maxLength={7}
                      autoCapitalize="characters"
                    />
                    {formCustomColor.length === 7 && (
                      <View style={[themedStyles.gFormColorPreview, { backgroundColor: formCustomColor }]} />
                    )}
                  </View>
                </View>
              )}

              {formStep === 3 && (
                <View>
                  <Text style={themedStyles.gFormSectionTitle}>Nombre y notas</Text>
                  <Text style={themedStyles.gFormLabel}>Nombre (opcional)</Text>
                  <TextInput
                    style={themedStyles.gFormTextInput}
                    placeholder="Ej: Blusa blanca elegante"
                    placeholderTextColor="#999"
                    value={formName}
                    onChangeText={setFormName}
                    maxLength={60}
                  />
                  <Text style={themedStyles.gFormLabel}>Notas (opcional)</Text>
                  <TextInput
                    style={[themedStyles.gFormTextInput, themedStyles.gFormTextArea]}
                    placeholder="Ej: Perfecta para la oficina"
                    placeholderTextColor="#999"
                    value={formNotes}
                    onChangeText={setFormNotes}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                  />
                  <View style={themedStyles.gFormSummary}>
                    <Text style={themedStyles.gFormSummaryText}>
                      {GARMENT_CATEGORIES_LABELS[formCategory]} — {formSubtype}
                    </Text>
                    <View style={[themedStyles.gFormSummaryDot, { backgroundColor: formCustomColor.trim() || formColor }]} />
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={themedStyles.gFormFooter}>
              {formStep > 1 && (
                <TouchableOpacity style={themedStyles.gFormBackBtn} onPress={() => setFormStep(formStep - 1)}>
                  <Ionicons name="chevron-back" size={18} color={colors.textSecondary || '#666'} />
                  <Text style={themedStyles.gFormBackText}>Atrás</Text>
                </TouchableOpacity>
              )}
              {formStep < 3 ? (
                <TouchableOpacity
                  style={[themedStyles.gFormNextBtn, (!formSubtype || !pendingGarment) && themedStyles.gFormNextBtnDisabled]}
                  disabled={!formSubtype || !pendingGarment}
                  onPress={() => setFormStep(formStep + 1)}
                >
                  <Text style={themedStyles.gFormNextBtnText}>Siguiente</Text>
                  <Ionicons name="chevron-forward" size={18} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={themedStyles.gFormSaveBtn}
                  onPress={saveGarment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <View style={themedStyles.gFormSaveProcessing}>
                      <ActivityIndicator size="small" color="#FFF" />
                      <Text style={themedStyles.gFormSaveProcessingText}>{processingLabel}</Text>
                    </View>
                  ) : (
                    <Text style={themedStyles.gFormSaveBtnText}>Guardar prenda</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {!formSubtype && formStep < 3 && (
              <Text style={themedStyles.gFormHint}>Selecciona un tipo de prenda para continuar</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Outfit detail modal */}
      <Modal
        visible={showOutfitDetail}
        transparent
        animationType="slide"
        onRequestClose={handleCloseOutfitDetail}
      >
        <View style={themedStyles.gFormOverlay}>
          <TouchableOpacity
            style={themedStyles.gFormBackdrop}
            activeOpacity={1}
            onPress={handleCloseOutfitDetail}
          />
          <View style={themedStyles.outfitDetailContent}>
            {/* Header */}
            <View style={themedStyles.outfitDetailHeader}>
              <Text style={themedStyles.outfitDetailTitle} numberOfLines={1}>
                {selectedOutfit?.name || 'Detalles del outfit'}
              </Text>
              <TouchableOpacity
                style={themedStyles.gFormCloseBtn}
                onPress={handleCloseOutfitDetail}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Outfit meta */}
            {selectedOutfit && (
              <View style={themedStyles.outfitDetailMeta}>
                <Text style={themedStyles.outfitDetailMetaText}>
                  {selectedOutfit.garments?.length || selectedOutfit.garment_ids?.length || 0} prendas
                </Text>
                {(() => {
                  const d = selectedOutfit.created_at?.toDate
                    ? selectedOutfit.created_at.toDate()
                    : selectedOutfit.created_at
                      ? new Date(selectedOutfit.created_at)
                      : null;
                  return d ? (
                    <Text style={themedStyles.outfitDetailMetaText}>
                      {d.getDate()}/{d.getMonth() + 1}/{d.getFullYear()}
                    </Text>
                  ) : null;
                })()}
                <TouchableOpacity
                  style={themedStyles.outfitDetailDeleteBtn}
                  onPress={() => {
                    handleCloseOutfitDetail();
                    handleDeleteOutfit(selectedOutfit);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#C0392B" />
                  <Text style={themedStyles.outfitDetailDeleteText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Garments list */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={themedStyles.outfitDetailList}
              showsVerticalScrollIndicator={false}
            >
              {selectedOutfit?.garments?.length > 0 ? (
                selectedOutfit.garments.map((garment, index) => (
                  <View key={garment.id || index} style={themedStyles.outfitDetailGarmentCard}>
                    <View style={themedStyles.outfitDetailGarmentImageWrap}>
                      {garment.image_url ? (
                        <Image
                          source={{ uri: garment.image_url }}
                          style={themedStyles.outfitDetailGarmentImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ fontSize: 48 }}>{garment.emoji || '👕'}</Text>
                      )}
                    </View>
                    <View style={themedStyles.outfitDetailGarmentInfo}>
                      <Text style={themedStyles.outfitDetailGarmentName}>
                        {garment.name || garment.subtype || 'Prenda'}
                      </Text>
                      {garment.subtype && (
                        <Text style={themedStyles.outfitDetailGarmentSub}>{garment.subtype}</Text>
                      )}
                      <View style={themedStyles.outfitDetailGarmentTags}>
                        <View style={themedStyles.outfitDetailTag}>
                          <Text style={themedStyles.outfitDetailTagText}>
                            {garment.category ? GARMENT_CATEGORIES_LABELS[garment.category] || garment.category : ''}
                          </Text>
                        </View>
                        {garment.color_hex && garment.color_hex !== 'multi' && (
                          <View style={[themedStyles.outfitDetailColorDot, { backgroundColor: garment.color_hex }]} />
                        )}
                      </View>
                      {garment.notes && (
                        <Text style={themedStyles.outfitDetailNotes} numberOfLines={2}>
                          {garment.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={themedStyles.emptyContainer}>
                  <Ionicons name="bag-outline" size={48} color="#DDD" />
                  <Text style={themedStyles.emptyText}>No hay prendas en este outfit</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function getStyles(colors, winHeight, insets = { top: 0, bottom: 0 }) {
  const safeHeight = winHeight || 700;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
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
      paddingBottom: 80 + insets.bottom,
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
      paddingBottom: 20 + insets.bottom + 80,
    },
    columnWrapper: {
      gap: 10,
    },
    outfitListContent: {
      paddingHorizontal: 10,
      paddingBottom: 20 + insets.bottom + 80,
    },
    outfitColumnWrapper: {
      gap: 10,
    },
    outfitCard: {
      backgroundColor: colors.card,
      flex: 1,
      borderRadius: 16,
      marginBottom: 12,
      overflow: 'hidden',
      ...Platform.select({
        web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
      }),
    },
    outfitCardPreview: {
      width: '100%',
      aspectRatio: 1.2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.inventoryCard,
    },
    outfitCardImage: {
      width: '100%',
      height: '100%',
    },
    outfitCardInfo: {
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    outfitCardName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    outfitCardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    outfitCardCount: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    outfitCardDate: {
      fontSize: 10,
      color: colors.textTertiary,
    },
    outfitDeleteBtn: {
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
    card: {
      backgroundColor: colors.inventoryCard,
      width: '30%',
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
      bottom: 24 + insets.bottom,
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
      bottom: 100 + insets.bottom,
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

    // Garment form styles — redesigned responsive layout
    gFormOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    gFormBackdrop: {
      flex: 1,
    },
    gFormSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      height: Math.min(safeHeight * 0.88, 620),
      paddingBottom: Math.max(insets.bottom + 8, 12),
    },
    gFormHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    gFormCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gFormTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    gFormPreviewWrap: {
      marginHorizontal: 20,
      borderRadius: 12,
      backgroundColor: colors.background,
      overflow: 'hidden',
      height: 110,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gFormPreviewImage: {
      width: '100%',
      height: '100%',
    },
    gFormPreviewPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    gFormPreviewPlaceholderText: {
      fontSize: 12,
      color: '#AAA',
      marginTop: 4,
    },
    gFormEmojiWrap: {
      marginHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      backgroundColor: colors.background,
      borderRadius: 12,
    },
    gFormEmojiText: {
      fontSize: 44,
    },
    gFormSteps: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 4,
    },
    gFormStepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    gFormStepDotActive: {
      backgroundColor: '#E67E22',
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    gFormStepLine: {
      width: 28,
      height: 2,
      backgroundColor: colors.border,
    },
    gFormBody: {
      flex: 1,
    },
    gFormBodyContent: {
      paddingHorizontal: 20,
      paddingBottom: 4,
    },
    gFormSectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 14,
      color: colors.text,
    },
    gFormLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    gFormChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 14,
    },
    gFormChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    gFormChipActive: {
      backgroundColor: '#E67E22',
      borderColor: '#E67E22',
    },
    gFormChipText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    gFormChipTextActive: {
      color: '#FFF',
      fontWeight: '600',
    },
    gFormColorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 16,
    },
    gFormColorSwatch: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gFormColorSwatchSelected: {
      borderWidth: 3,
      borderColor: colors.text,
    },
    gFormColorInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 6,
    },
    gFormColorLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    gFormColorInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      fontSize: 13,
      color: colors.text,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    gFormColorPreview: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    gFormTextInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontSize: 14,
      color: colors.text,
      marginBottom: 14,
    },
    gFormTextArea: {
      minHeight: 64,
      textAlignVertical: 'top',
    },
    gFormSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 4,
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: colors.background,
      borderRadius: 10,
    },
    gFormSummaryText: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
    },
    gFormSummaryDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.border,
    },
    gFormFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 6,
    },
    gFormBackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    gFormBackText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    gFormNextBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: '#E67E22',
      borderRadius: 10,
      paddingVertical: 12,
    },
    gFormNextBtnDisabled: {
      opacity: 0.4,
    },
    gFormNextBtnText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '600',
    },
    gFormSaveBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: '#E67E22',
      alignItems: 'center',
    },
    gFormSaveBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFF',
    },
    gFormSaveProcessing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    gFormSaveProcessingText: {
      fontSize: 13,
      color: '#FFF',
      fontWeight: '500',
    },
    gFormHint: {
      textAlign: 'center',
      color: '#E67E22',
      fontSize: 11,
      paddingHorizontal: 20,
      paddingTop: 6,
    },

    // Outfit detail modal styles
    outfitDetailContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 16,
      paddingHorizontal: 20,
      paddingBottom: Math.max(insets.bottom + 16, 24),
      height: Math.min(safeHeight * 0.88, 620),
    },
    outfitDetailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    outfitDetailTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      marginRight: 12,
    },
    outfitDetailMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    outfitDetailMetaText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    outfitDetailDeleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 'auto',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: '#FDE8E8',
    },
    outfitDetailDeleteText: {
      fontSize: 12,
      color: '#C0392B',
      fontWeight: '500',
    },
    outfitDetailList: {
      paddingBottom: 20,
      gap: 12,
    },
    outfitDetailGarmentCard: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 16,
      overflow: 'hidden',
      ...Platform.select({
        web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
      }),
    },
    outfitDetailGarmentImageWrap: {
      width: 100,
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.inventoryCard,
    },
    outfitDetailGarmentImage: {
      width: '100%',
      height: '100%',
    },
    outfitDetailGarmentInfo: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      justifyContent: 'center',
    },
    outfitDetailGarmentName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    outfitDetailGarmentSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    outfitDetailGarmentTags: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    outfitDetailTag: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    outfitDetailTagText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    outfitDetailColorDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    outfitDetailNotes: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 4,
      lineHeight: 16,
    },
  });
}

export default InventarioScreen;